import React from 'react';
import './App.css';
import qs from "query-string";
import pluralize from "pluralize";
import xbytes from 'xbytes';


const MaxLevelCount = 5;
const DefaultLevelCount = 3;
const DefaultReplicationFactor = 3;
const Max_vCPUs = 256;
const Min_vCPUs= 2;

const Bytes_per_vCPU = xbytes.parseBytes("150 GB").bytes;
const IOPS_per_vCPU = 500;
const MBPS_per_vCPU = 30;
const Connections_per_vCPU = 4;
const RAM_per_vCPU = xbytes.parseBytes("4 GiB").bytes;

const DefaultNamesByLevel: { [count: number]: Array<string> } = {
  1: ["Nodes"],
  2: ["Data Centers", "Nodes"],
  3: ["Regions", "Availability Zones", "Nodes"],
  4: ["Regions","Data Centers","Availability Zones","Nodes"],
  5: ["Regions","Data Centers","Availability Zones","Racks","Nodes"],
};

const DefaultCountsByLevel: { [count: number]: Array<number> } = {
  1: [3],
  2: [3,3],
  3: [3,3,3],
  4: [3,3,3,3],
  5: [3,3,3,3,3],
}

interface NodeProps {
  key: string;
  id: number;
  failed: boolean;
  replicas: number;
  name: string;
  children: Array<NodeProps>;
  className: string;
  depth: number;
}

interface Spec {
  Storage: {
    Capacity: number,
    CapacityPerNode: number,
    RealCapacity: number,
    IOPS: number,
    IOPS_per_node: number,
    MBPS: number,
    MBPS_per_node: number,
    RAM_per_node: number,
  },
  Concurrency: {
    Connections: number,
  }
}

function calculateSpecs(
  vCPUs: number,
  replicationFactor: number,
  vCPUs_per_node: number,
  nodeCount: number,
  ): Spec {
  return {
    Storage: {
      Capacity: vCPUs * Bytes_per_vCPU,
      CapacityPerNode: vCPUs * Bytes_per_vCPU / nodeCount,
      RealCapacity: vCPUs * Bytes_per_vCPU / replicationFactor,
      IOPS: vCPUs * IOPS_per_vCPU,
      IOPS_per_node: IOPS_per_vCPU * vCPUs_per_node,
      MBPS: vCPUs * MBPS_per_vCPU,
      MBPS_per_node: MBPS_per_vCPU * vCPUs_per_node,
      RAM_per_node: RAM_per_vCPU * vCPUs_per_node,
    },
    Concurrency: {
      Connections: vCPUs * Connections_per_vCPU,
    }
  }
}

// Just to wrapper functions to ensure we don't get errors from the pluralize
// library.
function plural(value: any) {
  return pluralize.plural(value || "");
}
function singular(value: any) {
  return pluralize.singular(value || "");
}

function pickBoxClass(node: NodeProps): string {
  if (node.failed) {
    return "Box-failed";
  }
  if (node.replicas === 0) {
    return "Box-empty";
  }
  return "Box";
}

class Node extends React.Component<NodeProps, {}> {
  render() {
    const children = this.props.children.map((n) =>
      <Node {...n} />
    );
    let boxClassName = pickBoxClass(this.props);
    let replicaClassName = this.props.replicas > 0 ? "Replicas-full" : "Replicas-empty";
    return (
      <div className={`${boxClassName}`}>
        <div>{this.props.name} {this.props.id}</div>
        <div className={`${replicaClassName}`}>Replicas {this.props.replicas}</div>
        <div className={this.props.className}>
          {children}
        </div>
      </div>
    );
  }
}

function limit(num: number, min: number, max: number): number {
  if (num < min) {
    return min;
  }
  if (num > max) {
    return max;
  }
  return num;
}

type UserState = {
  levelCount: number;
  names: Array<string>;
  counts: Array<number>;
  replicationFactor: number;
  failureMode: number;
  vCPUs: number;
}

function GetDefaultUserState(levelCount: number): UserState {
  return {
    levelCount: levelCount,
    names: [...DefaultNamesByLevel[levelCount]],
    counts: [...DefaultCountsByLevel[levelCount]],
    replicationFactor: DefaultReplicationFactor,
    failureMode: 1,
    vCPUs: 4,
  }
}

function populateSearch(state: UserState) {
  const newSearch = qs.stringify(state, {arrayFormat: 'comma'});
  const parsedURL = qs.parseUrl(window.location.href);
  const oldSearch = qs.stringify(parsedURL.query, {arrayFormat: 'comma'});
  if (newSearch === oldSearch) {
    return
  }
  const newURL = parsedURL.url + '?' + newSearch;
  window.history.pushState(state, "CockroachDB Survival Tool", newURL);
}

function fixUserState(state: UserState): UserState {
  state.levelCount = limit(state.levelCount, 1, MaxLevelCount);
  const defaultUserState = GetDefaultUserState(state.levelCount);
  for (let i = 0; i < state.levelCount; i++) {
    state.names[i] = state.names[i] || defaultUserState.names[i];
    state.counts[i] = limit(state.counts[i], 1, i === state.levelCount - 1 ? 100: 10);
  }
  if (state.names.length > state.levelCount) {
    state.names = state.names.slice(0, state.levelCount)
  }
  if (state.counts.length > state.levelCount) {
    state.counts = state.counts.slice(0, state.levelCount)
  }
  if (state.replicationFactor % 2 === 0) {
    state.replicationFactor--;
  }
  state.replicationFactor = limit(state.replicationFactor, 1, 99);
  state.failureMode = limit(state.failureMode, 0, state.levelCount);
  state.vCPUs = limit(state.vCPUs, Min_vCPUs, Max_vCPUs);

  return state;
}

function fetchState(): UserState {
  const defaultUserState = GetDefaultUserState(5);
  let userState = GetDefaultUserState(5);
  Object.entries(qs.parse(window.location.search, {arrayFormat: 'comma'})).forEach(
    ([key, value]) => {
      switch (key) {
        case "counts":
          if (value == null || !Array.isArray(value)) {
            userState.counts = defaultUserState.counts;
            break;
          }
          if (!Array.isArray(value)) {
            userState.counts = defaultUserState.counts;
            break;
          }
          let valueArray = value as Array<string>;
          valueArray.forEach((v,i) => {
            userState.counts[i] = parseInt(v + "") || defaultUserState.counts[i];
          })
          break;
        case "names":
          if (value == null || !Array.isArray(value)) {
            userState.names = defaultUserState.names;
            break;
          }
          if (!Array.isArray(value)) {
            userState.names = defaultUserState.names;
            break;
          }
          userState.names = value;
          break;
        case "replicationFactor": userState.replicationFactor = parseInt(value + "") || defaultUserState.replicationFactor; break;
        case "failureMode": userState.failureMode = parseInt(value + "") || defaultUserState.failureMode; break;
        case "levelCount": userState.levelCount = parseInt(value + "") || defaultUserState.levelCount; break;
        case "vCPUS": userState.levelCount = parseInt(value + "") || defaultUserState.vCPUs; break;
      }
    }
  )
  userState = fixUserState(userState);
  return userState;
}

interface MainFormState {
  userState: UserState;
  failures: Array<number>;
  deadReplicas: number;
  allowableDead: number;
  nodes: NodeProps;
  nodeCount: number;
  specs: Spec;
}

class MainForm extends React.Component<{}, MainFormState> {
  constructor(props: any) {
    super(props);

    let userState = GetDefaultUserState(DefaultLevelCount);
    if (window.location.search.length === 0) {
      populateSearch(userState);
    } else {
      userState = fetchState();
    }

    this.state = {
      userState: userState,
      failures: new Array(userState.levelCount).fill(0),
      deadReplicas: 0,
      allowableDead: 0,
      nodes: {
        key: "sentinel",
        id: 0,
        failed: false,
        replicas: 0,
        name: "sentinel",
        children: [],
        className: "sentinel",
        depth: 0,
      },
      nodeCount: 0,
      specs: calculateSpecs(0, 0, 0, 0),
    };

    this.handleCountChange = this.handleCountChange.bind(this)
    this.handleReplicationFactorChange = this.handleReplicationFactorChange.bind(this);
    this.handleFailureModeChange = this.handleFailureModeChange.bind(this);
    this.handleLevelsChange = this.handleLevelsChange.bind(this);
    this.handlevCPUChange = this.handlevCPUChange.bind(this);
  }

  componentDidMount() {
    window.addEventListener("popstate", e => {
      this.handlePopState();
    });
    let curState = this.getCurrentState();
    this.setState(this.update(curState));
  }

  handlePopState() {
    let curState = this.getCurrentState();
    curState.userState = curState.userState = fetchState();
    this.setState(this.update(curState));
  }

  getCurrentState(): MainFormState {
    return {
      userState: this.state.userState,
      failures: this.state.failures,
      deadReplicas: this.state.deadReplicas,
      allowableDead: this.state.allowableDead,
      nodes: this.state.nodes,
      nodeCount: this.state.nodeCount,
      specs: this.state.specs,
    };
  }

  handleCountChange(level: number, event: any) {
    let curState = this.getCurrentState();
    const defaultUserState = GetDefaultUserState(curState.userState.levelCount);
    let value = parseInt(event.target.value);
    // Allow 0, so it can be reset to 1, but don't allow undef or other weirdness.
    value = value === 0 ? value : value || defaultUserState.counts[level];
    curState.userState.counts[level] = value;
    this.setState(this.update(curState));
  }
  handleReplicationFactorChange(event: any) {
    let curState = this.getCurrentState();
    const defaultUserState = GetDefaultUserState(curState.userState.levelCount);
    let value = parseInt(event.target.value) || defaultUserState.replicationFactor;
    if (value % 2 === 0) {
      if (this.state.userState.replicationFactor > value) {
        value--;
      } else {
        value++;
      }
    }
    curState.userState.replicationFactor = value;
    this.setState(this.update(curState), this.forceUpdate);
  }
  handleFailureModeChange(event: any) {
    let curState = this.getCurrentState();
    curState.userState.failureMode = parseInt(event.target.value) || 0;
    this.setState(this.update(curState));
  }
  handleLevelsChange(event: any) {
    let value = parseInt(event.target.value);
    // Allow 0, so it can be reset to 1, but don't allow undef or other weirdness.
    value = value === 0 ? value : value || DefaultLevelCount;
    value = limit(value, 1,5)
    let curState = this.getCurrentState();
    // Adjust the other values accordingly.
    if (curState.userState.levelCount > value) {
      curState.userState.names.shift();
      curState.userState.counts.shift();
    } else if (curState.userState.levelCount < value) {
      const defaultUserState = GetDefaultUserState(value);
      curState.userState.names = defaultUserState.names;
      curState.userState.counts.unshift(defaultUserState.counts[0]);
    }
    curState.userState.levelCount = value;
    curState.failures = new Array(value).fill(0);
    this.setState(this.update(curState));
  }
  handlevCPUChange(event: any) {
    let curState = this.getCurrentState();
    const defaultUserState = GetDefaultUserState(curState.userState.levelCount);
    curState.userState.vCPUs = parseInt(event.target.value) || defaultUserState.vCPUs;
    this.setState(this.update(curState));
  }

  // Create all the nodes and their children based on the topology of the system.
  populateNodeChildren(node: NodeProps, state: UserState) {
    for (let i = 0; i < state.counts[node.depth]; i++) {
      const childKey = `${node.key}-${i+1}`;
      let child: NodeProps = {
        key: childKey,
        id: i + 1,
        failed: false,
        replicas: 0,
        name: singular(state.names[node.depth]),
        children: [],
        className: `level${node.depth+1}`,
        depth: node.depth+1,
      }
      // Add children (recursively)
      this.populateNodeChildren(child, state);
      // Add the child to this node.
      node.children.push(child);
    }
  }

  // Adds the example range by distributing the replicas amongst the nodes.
  addRange(node: NodeProps, numReplicas: number) {
    // First calculate the number of replicas per child node.
    const div = Math.floor(numReplicas / node.children.length);
    const remainder = numReplicas % node.children.length;
    let replicasPerChild = new Array(node.children.length).fill(div);
    for (let i = 0; i < remainder; i++) {
      replicasPerChild[i]++;
    }
    // Now populate them, recursively.
    for (let i = 0; i < node.children.length; i++) {
      if (replicasPerChild[i] > 0) {
        this.addRange(node.children[i], replicasPerChild[i]);
      } else {
        // no more replicas to divvy out.
        break;
      }
    }
    node.replicas = numReplicas
  }

  // Mark all possible nodes as killed, limited by the failure mode level.
  killReplicas(
    node: NodeProps,
    failureMode: number,
    replicasToKill: number,
    failures: Array<number>,
    levels: number,
  ): number {
    if ((failureMode === 0) || (replicasToKill === 0) || (node.replicas === 0)) {
      return 0;
    }

    // This is a super strange tree walk. It has to go level by level and then
    // hit the first child of each parent.  We also need to skip any node that
    // is lower than any skipped ones at that level.
    interface tuple {
      n: NodeProps;
      i: number;
    }
    let queue: Array<tuple> = [{n: node, i: 0}];
    let nextQueue: Array<tuple> = [];
    let cur: tuple | undefined;
    let remainingReplicas: number = replicasToKill;
    let skippedLevelReplicaCount = 0;
    while ((remainingReplicas > 0) ) {
      if (queue.length === 0) {
        if (nextQueue.length === 0) {
          // We are done!
          break;
        }
        queue = [...nextQueue];
        nextQueue = [];
        skippedLevelReplicaCount = 0;
      }
      cur = queue.shift();
      if ((cur === undefined) || (cur.n.replicas === 0)) {
        break;
      }
      // Get the child node we're going to be working with for now.
      const child = cur.n.children[cur.i];
      if (
        (failureMode <= child.depth) &&
        (child.replicas <= remainingReplicas) &&
        (child.replicas >= skippedLevelReplicaCount)
      ) {
        // We can kill this whole cur node.
        child.failed = true;
        failures[child.depth]++;
        remainingReplicas-=child.replicas;
      } else if (child.children.length > 0) {
        // Push the first child to the end of the queue.
        nextQueue.push({n: child, i: 0});
        skippedLevelReplicaCount = Math.max(skippedLevelReplicaCount, child.replicas);
      }
      // If there is another child, add it.
      if (cur.i+1 < cur.n.children.length) {
        queue.push({n: cur.n, i: cur.i+1})
      }
    }
    return replicasToKill - remainingReplicas;
  }

  update(state: MainFormState): MainFormState {
    // Update the search params.
    state.userState = fixUserState(state.userState);
    populateSearch(state.userState);

    // Spec out the whole system.
    state.allowableDead = Math.floor(state.userState.replicationFactor / 2);
    state.nodeCount = state.userState.counts.reduce((a,b) => a * b, 1);

    // Pre-populate all levels, use a sentinel node to make the recursion easier.
    state.nodes = {
      key: "s",
      id: 0,
      failed: false,
      replicas: 0,
      name: "sentinel",
      children: [],
      className: "sentinel",
      depth: 0,
    }
    this.populateNodeChildren(state.nodes, state.userState);

    // Add the example range.
    this.addRange(state.nodes, state.userState.replicationFactor)

    state.failures = new Array(state.userState.levelCount+1).fill(0);
    // Add in the dead replicas
    state.deadReplicas = (state.nodeCount < state.userState.replicationFactor) ? 0 :
      this.killReplicas(
        state.nodes,
        state.userState.failureMode,
        state.allowableDead,
        state.failures,
        state.userState.levelCount,
      );

    // Remove the extra failure level.
    state.failures.shift()

    // Calculate the specs.
    state.specs = calculateSpecs(
      state.userState.vCPUs*state.nodeCount,
      state.userState.replicationFactor,
      state.userState.vCPUs,
      state.nodeCount,
    );

    return state;
  }

  render() {
    const nodeName = this.state.userState.names[this.state.userState.names.length-1];
    let failureDisplay: Array<string> = Array(this.state.failures.length);
    let foundValue = false;
    this.state.failures.forEach((f,i) => {
      if (i < this.state.userState.failureMode-1) {
        failureDisplay[i] = "Ignore";
      } else {
        if (foundValue) {
          failureDisplay[i] = "Display";
        } else if (f === 0) {
          failureDisplay[i] = "Warning";
        } else {
          failureDisplay[i] = "Display";
          foundValue = true;
        }
      }
    });
    return (
      <div>
        <div className="App-form">
          <form>
            <table className="App-table">
              <thead>
                <tr>
                  {
                    this.state.userState.names.map((name, i) => {
                      return <th key={`title-${name}-${i}`}>{plural(name)}</th>;
                    })
                  }
                  <th>Replication Factor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {
                    this.state.userState.names.map((name, i) =>
                      <td key={`input-${name}-${i}`}>
                        <input className="App-input"
                          type="number"
                          name={name}
                          value={this.state.userState.counts[i]}
                          onChange={(e) => this.handleCountChange(i, e)} />
                      </td>
                    )
                  }
                  <td>
                    <input className="App-input" name="replicationFactor" type="number" value={this.state.userState.replicationFactor} onChange={this.handleReplicationFactorChange} />
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="Selector">
              <div>Failure Mode:</div>
              <select className="FailureSelect" value={this.state.userState.failureMode} onChange={this.handleFailureModeChange}>
                <option value={0}>None</option>
                {
                  this.state.userState.names.map((n,i) =>
                    <option value={i+1} key={`failureMode-${n}-${i}`}>{singular(n)}</option>
                  )
                }
              </select>
            </div>
          </form>
        </div>
        {
          this.state.nodeCount < this.state.userState.replicationFactor && <div className="Underreplicated">
            The system is underreplicated: There are {this.state.nodeCount} nodes, but {this.state.userState.replicationFactor} are needed.
          </div>
        }
        {
          this.state.userState.failureMode !== 0 && <div className="FailureResults">
            <div>With {this.state.userState.replicationFactor}x replication you can survive a max of {this.state.allowableDead} dead replica{this.state.allowableDead !== 1 && "s"}.</div>
            <div>This scenario will survive losing at most:</div>
            <div className="FailureTable">
              {
                this.state.failures.map((v, i) => {
                  if (failureDisplay[i] === "Ignore") {
                    return false;
                  }
                  return <div className="FailureRow" key={`failureRow-${v}-${i}`}>
                    <div className="FailureColumn">
                      <div className={`FailureHeader${failureDisplay[i]}`}>{plural(this.state.userState.names[i])}</div>
                    </div>
                    <div className="FailureColumn">
                      <div className={`FailureValue${failureDisplay[i]}`}>{this.state.failures[i]}</div>
                    </div>
                  </div>
                })
              }
            </div>
          </div>
        }
        <div className="App-container">
          {
            this.state.nodes.children.map((r) =>
              <Node {...r} />
            )
          }
        </div>
        <form>
          <div className="Selector">
            <div>Number of Levels:</div>
            <input className="App-input"
               type="number"
               name="levels"
               value={this.state.userState.levelCount}
               onChange={this.handleLevelsChange} />
          </div>
        </form>
        <form>
          <div className="Footer">
            <h2>Sizing Calculations</h2>
            <div className="Selector">
              <div>{`vCPUs per ${singular(nodeName)}`}</div>
              <input className="App-input"
                type="number"
                name="vCPUs"
                value={this.state.userState.vCPUs}
                onChange={this.handlevCPUChange} />
            </div>
            <div className="SizingResults">
            <div>
                With this setup, there are {this.state.nodeCount} {plural(nodeName)} and {this.state.nodeCount*this.state.userState.vCPUs} vCPUs.
              </div>
              <div>Some rule of thumb sizing calculations allow for:</div>
              <div className="SizingTable">
                <div className="SizingRpw">
                  <div className="SizingColumn">
                    <div className="SizingValue">
                      {xbytes(this.state.specs.Storage.Capacity, {iec: true})} ({xbytes(this.state.specs.Storage.Capacity, {iec: false})}) total storage, {xbytes(this.state.specs.Storage.CapacityPerNode, {iec: true})} ({xbytes(this.state.specs.Storage.CapacityPerNode, {iec: false})}) storage per {singular(nodeName)}
                    </div>
                  </div>
                </div>
                <div className="SizingRpw">
                  <div className="SizingColumn">
                    <div className="SizingValue">
                      {xbytes(this.state.specs.Storage.RealCapacity, {iec: true})} ({xbytes(this.state.specs.Storage.RealCapacity, {iec: false})}) actual storage (due to {this.state.userState.replicationFactor}x replication)
                    </div>
                  </div>
                </div>
                <div className="SizingRpw">
                  <div className="SizingColumn">
                    <div className="SizingValue">
                      {this.state.specs.Storage.IOPS} IOPS total, {this.state.specs.Storage.IOPS_per_node} IOPS per {singular(nodeName)}
                    </div>
                  </div>
                </div>
                <div className="SizingRpw">
                  <div className="SizingColumn">
                    <div className="SizingValue">
                      {this.state.specs.Storage.MBPS} MBPS total, {this.state.specs.Storage.MBPS_per_node} MBPS per {singular(nodeName)}
                    </div>
                  </div>
                </div>
                <div className="SizingRpw">
                  <div className="SizingColumn">
                    <div className="SizingValue">
                      {xbytes(this.state.specs.Storage.RAM_per_node, {iec: true})} RAM per {singular(nodeName)} recommended
                    </div>
                  </div>
                </div>
                <div className="SizingRpw">
                  <div className="SizingColumn">
                    <div className="SizingValue">{this.state.specs.Concurrency.Connections} concurrent <i>active</i> connections</div>
                  </div>
                </div>
              </div>
              <div>
                <i>
                  *Please note that these values are rough approximations based on some back of the envelope calculations.
                </i>
              </div>
              <div>
                <i>
                  <b>
                    Contact Cockroach Labs for a more complete and accurate sizing calculation.
                  </b>
                </i>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <MainForm />
      </header>
    </div >
  );
}

export default App;