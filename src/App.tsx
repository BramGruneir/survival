import React from 'react';
import './App.css';

interface NodeProps {
  key: number;
  id: number;
  failed: boolean;
  replicas: number;
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
    this.update()
  }

  handleNumberRegionsChange(event: any) {
    let value = limit(event.target.value, 1, 10);
    this.setState({ numberRegions: value });
    this.update();
  }
  handleDCsPerRegionChange(event: any) {
    let value = limit(event.target.value, 1, 10);
    this.setState({ DCsPerRegion: value });
    this.update();
  }
  handleAZsPerDCChange(event: any) {
    let value = limit(event.target.value, 1, 10);
    this.setState({ AZsPerDC: value });
    this.update();
  }
  handleNodesPerAZChange(event: any) {
    let value = limit(event.target.value, 1, 100);
    this.setState({ NodesPerAZ: value });
    this.update();
  }
  handleReplicationFactorChange(event: any) {
    let value = event.target.value;
    if (value % 2 === 0) {
      if (this.state.replicationFactor > value) {
        value--;
      } else {
        value++;
      }
    }
    value = limit(value, 1, 99);
    this.setState({
      replicationFactor: value,
      allowableDead: Math.floor(this.state.replicationFactor / 2),
    });
    this.update();
  }
  handleFailureModeChange(event: any) {
    this.setState({ failureMode: event.target.value });
    this.update();
  }

  update() {
    // Spec out the whole system.

    // Regions
    let regions: Array<RegionProps> = [];
    for (let r = 0; r < this.state.numberRegions; r++) {
      let regionProps: RegionProps = {
        key: r,
        id: r + 1,
        failed: false,
        datacenters: [],
        replicas: 0,
      }

      // Data Centers
      for (let d = 0; d < this.state.DCsPerRegion; d++) {
        let dataCenterProps: DataCenterProps = {
          key: d,
          id: d + 1,
          failed: false,
          replicas: 0,
          availabilityZones: [],
        }

        // Availability Zones
        for (let a = 0; a < this.state.AZsPerDC; a++) {
          let availabilityZoneProps: AvailabilityZoneProps = {
            key: a,
            id: a + 1,
            failed: false,
            replicas: 0,
            nodes: [],
          }

          // Nodes
          for (let a = 0; a < this.state.NodesPerAZ; a++) {
            let nodeProps: NodeProps = {
              key: a,
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
      regions.push(regionProps);
    }

    // Add the example range.  This is not fun, there must be a better way.
    // Replicas per region
    for (let i = 0; i < this.state.replicationFactor; i++) {
      let region = i % this.state.numberRegions;
      regions[region].replicas++;
    }
    // Replicas per DC
    regions.forEach(r => {
      for (let i = 0; i < r.replicas; i++) {
        let dc = i % this.state.DCsPerRegion;
        r.datacenters[dc].replicas++;
      }
    });
    // Replicas per AZ
    regions.forEach(r =>
      r.datacenters.forEach(dc => {
        for (let i = 0; i < dc.replicas; i++) {
          let az = i % this.state.AZsPerDC;
          dc.availabilityZones[az].replicas++;
        }
      })
    );
    // Replicas per Nodes
    regions.forEach(r =>
      r.datacenters.forEach(dc =>
        dc.availabilityZones.forEach(az => {
          // This is technically not needed, can't put more than one replica on a node.
          for (let i = 0; i < az.replicas; i++) {
            let n = i % this.state.NodesPerAZ;
            az.nodes[n].replicas++;
          }
        })
      )
    );

    // Check for failures.
    let deadReplicas = 0;
    let failedRegions = 0;
    let failedDCs = 0;
    let failedAZs = 0;
    let failedNodes = 0;

    // Regions
    if (this.state.failureMode === FailureMode.Region) {
      for (let i = 0; i < this.state.numberRegions; i++) {
        if (regions[i].replicas === 0) {
          // An empty region means that the range never wrapped and we know the
          // rest of Regions or DCs will be empty.
          break;
        }
        if (deadReplicas + regions[i].replicas <= this.state.allowableDead) {
          regions[i].failed = true;
          deadReplicas += regions[i].replicas;
          failedRegions++;
        } else {
          // Don't continue here as these are traversed in order. This ensures
          // we don't kill a region with less replicas. We want worst case
          // scenario every time.
          break;
        }
      }
    }

    // DCs
    if (this.state.failureMode > FailureMode.None &&
      this.state.failureMode <= FailureMode.DataCenter &&
      deadReplicas < this.state.allowableDead) {
      // Traverse the first DC in each region, then the second DC in each region ...
      let i = -1;
      let j = 0;
      while (deadReplicas < this.state.allowableDead) {
        i++;
        if (i >= this.state.numberRegions) {
          i = 0;
          j++;
          if (j >= this.state.DCsPerRegion) {
            // We are at the end.
            break;
          }
        }
        if (regions[i].failed) {
          // Skip all failed regions.
          continue
        }
        if ((regions[i].replicas === 0) ||
          (regions[i].datacenters[j].replicas === 0)) {
          // An empty region or datacenter means that the range never wrapped
          // and we know the rest of Regions or DCs will be empty.
          break;
        }
        if (deadReplicas + regions[i].datacenters[j].replicas <= this.state.allowableDead) {
          regions[i].datacenters[j].failed = true;
          deadReplicas += regions[i].datacenters[j].replicas;
          failedDCs++;
        } else {
          // Don't continue here as these are traversed in order. This ensures
          // we don't kill a DC with less replicas. We want worst case scenario
          // every time.
          break;
        }
      }
    }

    // AZs
    if (this.state.failureMode > FailureMode.None &&
      this.state.failureMode <= FailureMode.AvailabilityZone &&
      deadReplicas < this.state.allowableDead) {
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
      while (deadReplicas < this.state.allowableDead) {
        i++;
        if (i >= this.state.numberRegions) {
          i = 0;
          j++;
          if (j >= this.state.DCsPerRegion) {
            j = 0;
            k++;
            if (k >= this.state.AZsPerDC) {
              // We are at the end.
              break;
            }
          }
        }
        if (regions[i].failed ||
          regions[i].datacenters[j].failed) {
          // Skip all failed regions and datacenters.
          continue;
        }
        if ((regions[i].replicas === 0) ||
          (regions[i].datacenters[j].replicas === 0) ||
          (regions[i].datacenters[j].availabilityZones[k].replicas === 0)) {
          // An empty region, DC or AZ means that the range never wrapped
          // and we know the rest of Regions, DCs or AZs will be empty.
          break;
        }

        if (deadReplicas + regions[i].datacenters[j].availabilityZones[k].replicas <= this.state.allowableDead) {
          regions[i].datacenters[j].availabilityZones[k].failed = true;
          deadReplicas += regions[i].datacenters[j].availabilityZones[k].replicas;
          failedAZs++;
        } else {
          // Don't continue here as these are traversed in order. This ensures
          // we don't kill a AZ with less replicas. We want worst case scenario
          // every time.
          break;
        }
      }
    }

    // Nodes
    if (this.state.failureMode > FailureMode.None &&
      this.state.failureMode <= FailureMode.Node &&
      deadReplicas < this.state.allowableDead) {
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
      while (deadReplicas < this.state.allowableDead) {
        i++;
        if (i >= this.state.numberRegions) {
          i = 0;
          j++;
          if (j >= this.state.DCsPerRegion) {
            j = 0;
            k++;
            if (k >= this.state.AZsPerDC) {
              k = 0;
              l++;
              if (l >= this.state.NodesPerAZ) {
                // We are at the end.
                break;
              }
            }
          }
        }
        if (regions[i].failed ||
          regions[i].datacenters[j].failed ||
          regions[i].datacenters[j].availabilityZones[k].failed
        ) {
          // Skip all failed regions, DCs and AZs.
          continue;
        }
        if ((regions[i].replicas === 0) ||
          (regions[i].datacenters[j].replicas === 0) ||
          (regions[i].datacenters[j].availabilityZones[k].replicas === 0) ||
          (regions[i].datacenters[j].availabilityZones[k].nodes[l].replicas === 0)) {
          // An empty region, DC, AZ or node means that the range never wrapped
          // and we know the rest of Regions, DCs, AZs or nodes will be empty.
          break;
        }

        if (deadReplicas + regions[i].datacenters[j].availabilityZones[k].nodes[l].replicas <= this.state.allowableDead) {
          regions[i].datacenters[j].availabilityZones[k].nodes[l].failed = true;
          deadReplicas += regions[i].datacenters[j].availabilityZones[k].nodes[l].replicas;
          failedNodes++;
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

    this.setState({
      regions: regions,
      deadReplicas: deadReplicas,
      failedRegions: failedRegions,
      failedDCs: failedDCs,
      failedAZs: failedAZs,
      failedNodes: failedNodes,
    })
  }

  render() {
    let regions = this.state.regions.map((r) =>
      <Region {...r} />
    );
    let nodeCount = this.state.numberRegions * this.state.DCsPerRegion * this.state.AZsPerDC * this.state.NodesPerAZ;
    let failureResults: Array<JSX.Element> = [];
    debugger
    if (this.state.failureMode > FailureMode.None) {
      switch (this.state.failureMode) {
        case (FailureMode.Region):
          failureResults = [
            <p>You can survive a max of {this.state.allowableDead} dead replica{this.state.allowableDead === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedRegions} region{this.state.failedRegions === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedDCs} additional data center{this.state.failedDCs === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedAZs} additional availability zone{this.state.failedAZs === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedNodes} additional node{this.state.failedNodes === 1 ? "" : "s"}.</p>,
          ]
          break;
        case (FailureMode.DataCenter):
          failureResults = [
            <p>You can survive a max of {this.state.allowableDead} dead replica{this.state.allowableDead === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedDCs} data center{this.state.failedDCs === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedAZs} additional availability zone{this.state.failedAZs === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedNodes} additional node{this.state.failedNodes === 1 ? "" : "s"}.</p>,
          ]
          break;
        case (FailureMode.AvailabilityZone):
          failureResults = [
            <p>You can survive a max of {this.state.allowableDead} dead replica{this.state.allowableDead === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedAZs} availability zone{this.state.failedAZs === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedNodes} additional node{this.state.failedNodes === 1 ? "" : "s"}.</p>,
          ]
          break;
        case (FailureMode.Node):
          failureResults = [
            <p>You can survive a max of {this.state.allowableDead} dead replica{this.state.allowableDead === 1 ? "" : "s"}.</p>,
            <p>You can lose {this.state.failedNodes} node{this.state.failedNodes === 1 ? "" : "s"}.</p>,
          ]
          break;
      }
    }
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
                  <th>
                    <input className="App-input" type="number" value={this.state.numberRegions} onChange={this.handleNumberRegionsChange} />
                  </th>
                  <th>
                    <input className="App-input" name="DCsPerRegion" type="number" value={this.state.DCsPerRegion} onChange={this.handleDCsPerRegionChange} />
                  </th>
                  <th>
                    <input className="App-input" name="AZsPerDC" type="number" value={this.state.AZsPerDC} onChange={this.handleAZsPerDCChange} />
                  </th>
                  <th>
                    <input className="App-input" name="NodesPerAZ" type="number" value={this.state.NodesPerAZ} onChange={this.handleNodesPerAZChange} />
                  </th>
                  <th>
                    <input className="App-input" name="replicationFactor" type="number" value={this.state.replicationFactor} onChange={this.handleReplicationFactorChange} />
                  </th>
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
          nodeCount < this.state.replicationFactor ?
            <div className="Underreplicated">
              The system is underreplicated: There are {nodeCount} nodes, but {this.state.replicationFactor} are needed.
          </div> : []
        }
        {
          this.state.failureMode === FailureMode.None ? [] :
            <div className="FailureResults">
              {failureResults}
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