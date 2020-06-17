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

interface MainFormState {
  numberRegions: number;
  DCsPerRegion: number;
  AZsPerDC: number;
  NodesPerAZ: number;
  replicationFactor: number;
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
      regions: [],
    };

    this.handleNumberRegionsChange = this.handleNumberRegionsChange.bind(this);
    this.handleDCsPerRegionChange = this.handleDCsPerRegionChange.bind(this);
    this.handleAZsPerDCChange = this.handleAZsPerDCChange.bind(this);
    this.handleNodesPerAZChange = this.handleNodesPerAZChange.bind(this);
    this.handleReplicationFactorChange = this.handleReplicationFactorChange.bind(this);
  }

  componentDidMount() {
    this.update()
  }

  handleNumberRegionsChange(event: any) {
    let value = limit(event.target.value, 1, 10)
    this.setState({ numberRegions: value })
    this.update()
  }
  handleDCsPerRegionChange(event: any) {
    let value = limit(event.target.value, 1, 10)
    this.setState({ DCsPerRegion: value })
    this.update()
  }
  handleAZsPerDCChange(event: any) {
    let value = limit(event.target.value, 1, 10)
    this.setState({ AZsPerDC: value })
    this.update()
  }
  handleNodesPerAZChange(event: any) {
    let value = limit(event.target.value, 1, 100)
    this.setState({ NodesPerAZ: value })
    this.update()
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
    value = limit(value, 1, 99)
    this.setState({ replicationFactor: value })
    this.update()
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

    this.setState({ regions: regions })
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
          </form>
        </div>
        {nodeCount < this.state.replicationFactor ?
          <div className="Underreplicated">
            The system is underreplicated: There are {nodeCount} nodes, but {this.state.replicationFactor} are needed.
          </div> : []
        }
        <div className="App-container">
          {regions}
        </div>
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