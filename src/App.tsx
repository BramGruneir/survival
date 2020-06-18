import React from 'react';
import './App.css';

interface NodeProps {
  key: string;
  id: number;
  failed: boolean;
  replicas: number;
}

function generateKey(props: NodeProps): string {
  //return `${props.id}-${props.replicas}-${props.failed}`;
  return Math.random().toString();
}

function pickBoxClass(node: NodeProps): string {
  if (node.failed) {
    return "Box-failed"
  }
  if (node.replicas === 0) {
    return "Box-empty"
  }
  return "Box"
}

class Node extends React.Component<NodeProps, {}> {
  render() {
    let boxClassName = pickBoxClass(this.props);
    let replicaClassName = this.props.replicas > 0 ? "Replicas-full" : "Replicas-empty";
    return (
      <div className={`${boxClassName}`}>
        <div>Node {this.props.id}</div>
        <div className={`${replicaClassName}`}>Replicas {this.props.replicas}</div>
      </div>
    );
  }
}

interface AvailabilityZoneProps extends NodeProps {
  nodes: Array<NodeProps>;
}

class AvailabilityZone extends React.Component<AvailabilityZoneProps, {}> {
  render() {
    let nodes = this.props.nodes.map((n) =>
      <Node {...n} />
    );
    let boxClassName = pickBoxClass(this.props);
    let replicaClassName = this.props.replicas > 0 ? "Replicas-full" : "Replicas-empty";
    return (
      <div className={`${boxClassName}`}>
        <div>AZ {this.props.id}</div>
        <div className={`${replicaClassName}`}>Replicas {this.props.replicas}</div>
        {nodes}
      </div>
    );
  }
}

interface DataCenterProps extends NodeProps {
  availabilityZones: Array<AvailabilityZoneProps>;
}

class DataCenter extends React.Component<DataCenterProps, {}> {
  render() {
    let azs = this.props.availabilityZones.map((az) =>
      <AvailabilityZone {...az} />
    );
    let boxClassName = pickBoxClass(this.props);
    let replicaClassName = this.props.replicas > 0 ? "Replicas-full" : "Replicas-empty";
    return (
      <div className={`${boxClassName}`}>
        <div>DC {this.props.id}</div>
        <div className={`${replicaClassName}`}>Replicas {this.props.replicas}</div>
        {azs}
      </div>
    );
  }
}

interface RegionProps extends NodeProps {
  datacenters: Array<DataCenterProps>;
}

class Region extends React.Component<RegionProps, {}> {
  render() {
    let dcs = this.props.datacenters.map((dc) =>
      <DataCenter {...dc} />
    );
    let boxClassName = pickBoxClass(this.props);
    let replicaClassName = this.props.replicas > 0 ? "Replicas-full" : "Replicas-empty";
    return (
      <div className={`${boxClassName}`}>
        <div>Region {this.props.id}</div>
        <div className={`${replicaClassName}`}>Replicas {this.props.replicas}</div>
        <div className="App-container">
          {dcs}
        </div>
      </div>
    );
  }
}

enum FailureMode {
  None,
  Region,
  DataCenter,
  AvailabilityZone,
  Node,
}

interface MainFormState {
  numberRegions: number;
  DCsPerRegion: number;
  AZsPerDC: number;
  NodesPerAZ: number;
  replicationFactor: number;
  failureMode: FailureMode;
  failedRegions: number;
  failedDCs: number;
  failedAZs: number;
  failedNodes: number;
  deadReplicas: number;
  allowableDead: number;
  regions: Array<RegionProps>;
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

class MainForm extends React.Component<{}, MainFormState> {
  constructor(props: any) {
    super(props);
    this.state = {
      numberRegions: 3,
      DCsPerRegion: 3,
      AZsPerDC: 3,
      NodesPerAZ: 3,
      replicationFactor: 3,
      failureMode: FailureMode.Region,
      failedRegions: 0,
      failedDCs: 0,
      failedAZs: 0,
      failedNodes: 0,
      deadReplicas: 0,
      allowableDead: 0,
      regions: [],
    };

    this.handleNumberRegionsChange = this.handleNumberRegionsChange.bind(this);
    this.handleDCsPerRegionChange = this.handleDCsPerRegionChange.bind(this);
    this.handleAZsPerDCChange = this.handleAZsPerDCChange.bind(this);
    this.handleNodesPerAZChange = this.handleNodesPerAZChange.bind(this);
    this.handleReplicationFactorChange = this.handleReplicationFactorChange.bind(this);
    this.handleFailureModeChange = this.handleFailureModeChange.bind(this);
  }

  componentDidMount() {
    let curState = this.getCurrentState();
    this.setState(this.update(curState))
  }

  getCurrentState(): MainFormState {
    return {
      numberRegions: this.state.numberRegions,
      DCsPerRegion: this.state.DCsPerRegion,
      AZsPerDC: this.state.AZsPerDC,
      NodesPerAZ: this.state.NodesPerAZ,
      replicationFactor: this.state.replicationFactor,
      failureMode: this.state.failureMode,
      failedRegions: this.state.failedRegions,
      failedDCs: this.state.failedDCs,
      failedAZs: this.state.failedAZs,
      failedNodes: this.state.failedNodes,
      deadReplicas: this.state.deadReplicas,
      allowableDead: this.state.allowableDead,
      regions: [],
    };
  }

  handleNumberRegionsChange(event: any) {
    let value = parseInt(event.target.value) || 1;
    value = limit(value, 1, 10);
    let curState = this.getCurrentState();
    curState.numberRegions = value;
    this.setState(this.update(curState))
  }
  handleDCsPerRegionChange(event: any) {
    let value = parseInt(event.target.value) || 1;
    value = limit(value, 1, 10);
    let curState = this.getCurrentState();
    curState.DCsPerRegion = value;
    this.setState(this.update(curState))
  }
  handleAZsPerDCChange(event: any) {
    let value = parseInt(event.target.value) || 1;
    value = limit(value, 1, 10);
    let curState = this.getCurrentState();
    curState.AZsPerDC = value;
    this.setState(this.update(curState))
  }
  handleNodesPerAZChange(event: any) {
    let value = parseInt(event.target.value) || 1;
    value = limit(value, 1, 100);
    let curState = this.getCurrentState();
    curState.NodesPerAZ = value;
    this.setState(this.update(curState))
  }
  handleReplicationFactorChange(event: any) {
    let value = parseInt(event.target.value) || 1;
    if (value % 2 === 0) {
      if (this.state.replicationFactor > value) {
        value--;
      } else {
        value++;
      }
    }
    value = limit(value, 1, 99);
    let curState = this.getCurrentState();
    curState.replicationFactor = value;
    this.setState(this.update(curState), this.forceUpdate)
  }
  handleFailureModeChange(event: any) {
    let curState = this.getCurrentState();
    curState.failureMode = parseInt(event.target.value) || FailureMode.None;
    this.setState(this.update(curState))
  }

  update(state: MainFormState): MainFormState {
    // Spec out the whole system.
    state.allowableDead = Math.floor(state.replicationFactor / 2);

    // Regions
    state.regions = [];
    for (let r = 0; r < state.numberRegions; r++) {
      let regionProps: RegionProps = {
        key: "",
        id: r + 1,
        failed: false,
        datacenters: [],
        replicas: 0,
      }

      // Data Centers
      for (let d = 0; d < state.DCsPerRegion; d++) {
        let dataCenterProps: DataCenterProps = {
          key: "",
          id: d + 1,
          failed: false,
          replicas: 0,
          availabilityZones: [],
        }

        // Availability Zones
        for (let a = 0; a < state.AZsPerDC; a++) {
          let availabilityZoneProps: AvailabilityZoneProps = {
            key: "",
            id: a + 1,
            failed: false,
            replicas: 0,
            nodes: [],
          }

          // Nodes
          for (let a = 0; a < state.NodesPerAZ; a++) {
            let nodeProps: NodeProps = {
              key: "",
              id: a + 1,
              failed: false,
              replicas: 0,
            }
            availabilityZoneProps.nodes.push(nodeProps);
          }
          dataCenterProps.availabilityZones.push(availabilityZoneProps);
        }
        regionProps.datacenters.push(dataCenterProps);
      }
      state.regions.push(regionProps);
    }

    // Add the example range.  This is not fun, there must be a better way.
    // Replicas per region
    for (let i = 0; i < state.replicationFactor; i++) {
      let region = i % state.numberRegions;
      state.regions[region].replicas++;
    }
    // Replicas per DC
    state.regions.forEach(r => {
      for (let i = 0; i < r.replicas; i++) {
        let dc = i % state.DCsPerRegion;
        r.datacenters[dc].replicas++;
      }
    });
    // Replicas per AZ
    state.regions.forEach(r =>
      r.datacenters.forEach(dc => {
        for (let i = 0; i < dc.replicas; i++) {
          let az = i % state.AZsPerDC;
          dc.availabilityZones[az].replicas++;
        }
      })
    );
    // Replicas per Nodes
    state.regions.forEach(r =>
      r.datacenters.forEach(dc =>
        dc.availabilityZones.forEach(az => {
          // This is technically not needed, can't put more than one replica on a node.
          for (let i = 0; i < az.replicas; i++) {
            let n = i % state.NodesPerAZ;
            az.nodes[n].replicas++;
          }
        })
      )
    );

    // Check for failures.
    state.deadReplicas = 0;
    state.failedRegions = 0;
    state.failedDCs = 0;
    state.failedAZs = 0;
    state.failedNodes = 0;

    // Regions
    if (state.failureMode === FailureMode.Region) {
      for (let i = 0; i < state.numberRegions; i++) {
        if (state.regions[i].replicas === 0) {
          // An empty region means that the range never wrapped and we know the
          // rest of Regions or DCs will be empty.
          break;
        }
        if (state.deadReplicas + state.regions[i].replicas <= state.allowableDead) {
          state.regions[i].failed = true;
          state.deadReplicas += state.regions[i].replicas;
          state.failedRegions++;
        } else {
          // Don't continue here as these are traversed in order. This ensures
          // we don't kill a region with less replicas. We want worst case
          // scenario every time.
          break;
        }
      }
    }

    // DCs
    if (state.failureMode > FailureMode.None &&
      state.failureMode <= FailureMode.DataCenter &&
      state.deadReplicas < state.allowableDead) {
      // Traverse the first DC in each region, then the second DC in each region ...
      let i = -1;
      let j = 0;
      while (state.deadReplicas < state.allowableDead) {
        i++;
        if (i >= state.numberRegions) {
          i = 0;
          j++;
          if (j >= state.DCsPerRegion) {
            // We are at the end.
            break;
          }
        }
        if (state.regions[i].failed) {
          // Skip all failed regions.
          continue
        }
        if ((state.regions[i].replicas === 0) ||
          (state.regions[i].datacenters[j].replicas === 0)) {
          // An empty region or datacenter means that the range never wrapped
          // and we know the rest of Regions or DCs will be empty.
          break;
        }
        if (state.deadReplicas + state.regions[i].datacenters[j].replicas <= state.allowableDead) {
          state.regions[i].datacenters[j].failed = true;
          state.deadReplicas += state.regions[i].datacenters[j].replicas;
          state.failedDCs++;
        } else {
          // Don't continue here as these are traversed in order. This ensures
          // we don't kill a DC with less replicas. We want worst case scenario
          // every time.
          break;
        }
      }
    }

    // AZs
    if (state.failureMode > FailureMode.None &&
      state.failureMode <= FailureMode.AvailabilityZone &&
      state.deadReplicas < state.allowableDead) {
      // Traversal order for a 3x3x3: (Region-DC-AZ)
      // 1-1-1, 2-1-1, 3-1-1,
      // 1-2-1, 2-2-1, 3-2-1,
      // 1-3-1, 2-3-1, 3-3-1,
      // 1-1-2, 2-1-2, 3-1-2,
      // 1-2-2, 2-2-2, 3-2-2,
      // 1-3-2, 2-3-2, 3-3-2,
      // 1-1-3, 2-1-3, 3-1-3,
      // 1-2-3, 2-2-3, 3-2-3,
      // 1-3-3, 2-3-3, 3-3-3,
      let i = -1;
      let j = 0;
      let k = 0;
      while (state.deadReplicas < state.allowableDead) {
        i++;
        if (i >= state.numberRegions) {
          i = 0;
          j++;
          if (j >= state.DCsPerRegion) {
            j = 0;
            k++;
            if (k >= state.AZsPerDC) {
              // We are at the end.
              break;
            }
          }
        }
        if (state.regions[i].failed ||
          state.regions[i].datacenters[j].failed) {
          // Skip all failed regions and datacenters.
          continue;
        }
        if ((state.regions[i].replicas === 0) ||
          (state.regions[i].datacenters[j].replicas === 0) ||
          (state.regions[i].datacenters[j].availabilityZones[k].replicas === 0)) {
          // An empty region, DC or AZ means that the range never wrapped
          // and we know the rest of Regions, DCs or AZs will be empty.
          break;
        }

        if (state.deadReplicas + state.regions[i].datacenters[j].availabilityZones[k].replicas <= state.allowableDead) {
          state.regions[i].datacenters[j].availabilityZones[k].failed = true;
          state.deadReplicas += state.regions[i].datacenters[j].availabilityZones[k].replicas;
          state.failedAZs++;
        } else {
          // Don't continue here as these are traversed in order. This ensures
          // we don't kill a AZ with less replicas. We want worst case scenario
          // every time.
          break;
        }
      }
    }

    // Nodes
    if (state.failureMode > FailureMode.None &&
      state.failureMode <= FailureMode.Node &&
      state.deadReplicas < state.allowableDead) {
      // Traversal order for a 2x2x2x2: (Region-DC-AZ-Nodes)
      // 1-1-1-1, 2-1-1-1,
      // 1-2-1-1, 2-2-1-1,
      // 1-1-2-1, 2-1-2-1,
      // 1-2-2-1, 2-2-2-1,
      // 1-1-1-2, 2-1-1-2,
      // 1-2-1-2, 2-2-1-2,
      // 1-1-2-2, 2-1-2-2,
      // 1-2-2-2, 2-2-2-2,

      let i = -1;
      let j = 0;
      let k = 0;
      let l = 0;
      while (state.deadReplicas < state.allowableDead) {
        i++;
        if (i >= state.numberRegions) {
          i = 0;
          j++;
          if (j >= state.DCsPerRegion) {
            j = 0;
            k++;
            if (k >= state.AZsPerDC) {
              k = 0;
              l++;
              if (l >= state.NodesPerAZ) {
                // We are at the end.
                break;
              }
            }
          }
        }
        if (state.regions[i].failed ||
          state.regions[i].datacenters[j].failed ||
          state.regions[i].datacenters[j].availabilityZones[k].failed
        ) {
          // Skip all failed regions, DCs and AZs.
          continue;
        }
        if ((state.regions[i].replicas === 0) ||
          (state.regions[i].datacenters[j].replicas === 0) ||
          (state.regions[i].datacenters[j].availabilityZones[k].replicas === 0) ||
          (state.regions[i].datacenters[j].availabilityZones[k].nodes[l].replicas === 0)) {
          // An empty region, DC, AZ or node means that the range never wrapped
          // and we know the rest of Regions, DCs, AZs or nodes will be empty.
          break;
        }

        if (state.deadReplicas + state.regions[i].datacenters[j].availabilityZones[k].nodes[l].replicas <= state.allowableDead) {
          state.regions[i].datacenters[j].availabilityZones[k].nodes[l].failed = true;
          state.deadReplicas += state.regions[i].datacenters[j].availabilityZones[k].nodes[l].replicas;
          state.failedNodes++;
        } else {
          // Don't continue here as these are traversed in order. This ensures
          // we don't kill a node with less replicas. We want worst case
          // scenario every time.
          // Since nodes should only ever have one replica, this only matters
          // when the cluster underreplicated.
          break;
        }
      }
    }

    state.regions.forEach(r => {
      r.key = generateKey(r);
      r.datacenters.forEach(dc => {
        dc.key = generateKey(dc);
        dc.availabilityZones.forEach(az => {
          az.key = generateKey(az);
          az.nodes.forEach(n => {
            n.key = generateKey(n);
          });
        });
      });
    });

    return state;
  }

  render() {
    let regions = this.state.regions.map((r) =>
      <Region {...r} />
    );
    let nodeCount = this.state.numberRegions * this.state.DCsPerRegion * this.state.AZsPerDC * this.state.NodesPerAZ;
    return (
      <div>
        <div className="App-form">
          <form>
            <table className="App-table">
              <thead>
                <tr>
                  <th>Regions</th>
                  <th>DCs per Region</th>
                  <th>AZs per DC</th>
                  <th>Nodes per AZ</th>
                  <th>Replication Factor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input className="App-input" type="number" value={this.state.numberRegions} onChange={this.handleNumberRegionsChange} />
                  </td>
                  <td>
                    <input className="App-input" name="DCsPerRegion" type="number" value={this.state.DCsPerRegion} onChange={this.handleDCsPerRegionChange} />
                  </td>
                  <td>
                    <input className="App-input" name="AZsPerDC" type="number" value={this.state.AZsPerDC} onChange={this.handleAZsPerDCChange} />
                  </td>
                  <td>
                    <input className="App-input" name="NodesPerAZ" type="number" value={this.state.NodesPerAZ} onChange={this.handleNodesPerAZChange} />
                  </td>
                  <td>
                    <input className="App-input" name="replicationFactor" type="number" value={this.state.replicationFactor} onChange={this.handleReplicationFactorChange} />
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="FailureMode">
              <div>Failure Mode:</div>
              <select className="FailureSelect" value={this.state.failureMode} onChange={this.handleFailureModeChange}>
                <option value={FailureMode.None}>None</option>
                <option value={FailureMode.Region}>Region</option>
                <option value={FailureMode.DataCenter}>DataCenter</option>
                <option value={FailureMode.AvailabilityZone}>AvailabilityZone</option>
                <option value={FailureMode.Node}>Node</option>
              </select>
            </div>
          </form>
        </div>
        {
          nodeCount < this.state.replicationFactor && <div className="Underreplicated">
            The system is underreplicated: There are {nodeCount} nodes, but {this.state.replicationFactor} are needed.
            </div>
        }
        {
          this.state.failureMode !== FailureMode.None && <div className="FailureResults">
            <div>With {this.state.replicationFactor}x replication you can survive a max of {this.state.allowableDead} dead replica{this.state.allowableDead !== 1 && "s"}.</div>
            <div>This scenario will survive losing at most:</div>
            <div className="FailureTable">
              {!!this.state.failedRegions &&
                <div className="FailureRow">
                  <div className="FailureColumn">
                    <div className="FailureHeader">Regions</div>
                  </div>
                  <div className="FailureColumn">
                    <div className="FailureValue">{this.state.failedRegions}</div>
                  </div>
                </div>
              }
              {!!(this.state.failedRegions || this.state.failedDCs) &&
                <div className="FailureRow">
                  <div className="FailureColumn">
                    <div className="FailureHeader">Data Centers</div>
                  </div>
                  <div className="FailureColumn">
                    <div className="FailureValue">{this.state.failedDCs}</div>
                  </div>
                </div>
              }
              {!!(this.state.failedRegions || this.state.failedDCs || this.state.failedAZs) &&
                <div className="FailureRow">
                  <div className="FailureColumn">
                    <div className="FailureHeader">Availability Zones</div>
                  </div>
                  <div className="FailureColumn">
                    <div className="FailureValue">{this.state.failedAZs}</div>
                  </div>
                </div>
              }
              <div className="FailureRow">
                <div className="FailureColumn">
                  <div className="FailureHeader">Nodes</div>
                </div>
                <div className="FailureColumn">
                  <div className="FailureValue">{this.state.failedNodes}</div>
                </div>
              </div>
            </div>
          </div>
        }
        <div className="App-container">
          {regions}
        </div>
      </div >
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