import { RenderGraph } from '../../../src/artgl';
import { PassGraphNode } from '../../../src/render-graph/dag/pass-graph-node';
import { DAGNode } from '../../../src/render-graph/dag/dag-node';
import { RenderTargetNode } from '../../../src/render-graph/dag/render-target-node';

export class GraphView {
  passNodes: GraphNodeView[] = [];
  targetNodes: GraphNodeView[] = [];
  passNodeMap: Map<string, GraphNodeView> = new Map();
  rootNode: GraphNodeView
  static create(graph: RenderGraph) {
    const view = new GraphView;
    graph.passNodes.forEach(node => {
      const nodeView = GraphNodeView.create(node)
      view.passNodeMap.set(node.uuid, nodeView)
      view.passNodes.push(nodeView);
    })
    graph.renderTargetNodes.forEach(node => {
      const nodeView = GraphNodeView.create(node)
      view.passNodeMap.set(node.uuid, nodeView)
      view.passNodes.push(nodeView);
    })

    view.passNodes.forEach(node => {
      node.inputsID.forEach(id => {
        node.inputs.push(view.passNodeMap.get(id));
      })
    })
    view.rootNode = view.passNodeMap.get(graph.getRootScreenTargetNode().uuid)

    view.layout();
    return view;
  }

  layout() {
    genGraphLayout(this.rootNode)
  }
}

function genGraphLayout(rootNode: GraphNodeView) {
  const horizonArray = [];
  function removeItem(node: GraphNodeView){
    horizonArray.forEach((row: GraphNodeView[])=> {
      row = row.filter(item => {
        return item !== node;
      })
    })
  }
  function addNode(node: GraphNodeView, horiPosition: number) {
    let arr = horizonArray[horiPosition];
    if (arr === undefined) {
      horizonArray[horiPosition] = [];
      arr = horizonArray[horiPosition];
    }
    removeItem(node);
    arr.push(node) 
    
    node.inputs.forEach(input => {
      addNode(input, horiPosition + 1);
    })
  }
  addNode(rootNode, 0);
  const rightBorder = 1500;
  const canvasHeigth = 800;
  const gridSize = 300;
  horizonArray.reverse().forEach((row, indexRow) => {
    const perItemHeight = canvasHeigth / row.length;
    row.forEach((item: GraphNodeView, indexY: number) => {
      item.positionX = indexRow * gridSize;
      item.positionY = indexY * perItemHeight
    })
  })
}

export class GraphNodeView {
  name: string;
  uuid: string;
  width: number = 200;
  height: number = 200;
  positionX: number = 0;
  positionY: number = 0;
  inputsID: string[] = [];
  inputs: GraphNodeView[] = [];

  static create(node: DAGNode) {
    const view = new GraphNodeView();
    view.uuid = node.uuid;
    view.inputsID = [];
    node.forFromNode(node => {
      view.inputsID.push(node.uuid);
    })

    if (node instanceof PassGraphNode) {
      view.name = node.name;
      view.height = 20;
    } else if (node instanceof RenderTargetNode) {
      view.name = node.name;
    }
    return view;
  }

  getConnectionLines(graph: GraphView, boardInfo) {
    return this.inputsID.map(id => {
      const inputNode = graph.passNodeMap.get(id);
      return {
        id: this.uuid + inputNode.uuid,
        line: createConectionSVGLine(
          inputNode.positionX + inputNode.width + boardInfo.transformX,
          inputNode.positionY + inputNode.height / 2 + boardInfo.transformY,
          this.positionX + boardInfo.transformX,
          this.positionY + this.height / 2 + boardInfo.transformY
        )
      }
    })
  }

}


function createConectionSVGLine(
  x1: number, y1: number,
  x2: number, y2: number,
  ) {
  const anchorStartX = (x1 + x2) * 0.5;
  return 'M ' + x1 + ' ' +
    y1 +
    ' C ' +
    anchorStartX + ' ' +
    y1 +
    ' , ' +
    anchorStartX + ' ' +
    y2 +
    ' , ' +
    x2 + ' ' +
    y2;
}