import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path';

export class CityTopology {
  private graph = new Graph();

  constructor() {
    // Build deterministic graph topology representing city nodes and transit edges
    this.graph.addNode('CITY_GATE', { type: 'GATE', x: 0, y: 0 });
    this.graph.addNode('TRANSIT_NODE_01', { type: 'TRANSIT', x: 2, y: 0 });
    this.graph.addNode('WU-01', { type: 'WORK_UNIT', x: 4, y: 0 });
    this.graph.addNode('WU-02', { type: 'WORK_UNIT', x: 6, y: 0 });
    this.graph.addNode('WU-03', { type: 'WORK_UNIT', x: 8, y: 0 });
    this.graph.addNode('WU-04', { type: 'WORK_UNIT', x: 10, y: 0 });
    this.graph.addNode('TRANSIT_NODE_02', { type: 'TRANSIT', x: 12, y: 0 });
    this.graph.addNode('GATE-01-CONSTITUTION', { type: 'GATE', x: 14, y: 0 });

    // Add valid validated edges
    this.addEdge('CITY_GATE', 'TRANSIT_NODE_01');
    this.addEdge('TRANSIT_NODE_01', 'WU-01');
    this.addEdge('WU-01', 'WU-02');
    this.addEdge('WU-02', 'WU-03');
    this.addEdge('WU-03', 'WU-04');
    this.addEdge('WU-04', 'TRANSIT_NODE_02');
    this.addEdge('TRANSIT_NODE_02', 'GATE-01-CONSTITUTION');
  }

  private addEdge(from: string, to: string) {
    if (!this.graph.hasEdge(from, to)) {
      this.graph.addEdge(from, to, { weight: 1 });
    }
  }

  public getShortestPath(source: string, target: string): string[] | null {
    if (!this.graph.hasNode(source) || !this.graph.hasNode(target)) {
      return null;
    }
    return bidirectional(this.graph, source, target);
  }

  public hasNode(nodeId: string): boolean {
    return this.graph.hasNode(nodeId);
  }
}

export const CityTopologyInstance = new CityTopology();
