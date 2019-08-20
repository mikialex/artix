import { RenderGraph } from "./render-graph";
import { PassDefine } from "./interface";
import { Nullable } from "../type";
import { RenderTargetNode } from "./node/render-target-node";
import { PassGraphNode } from "./node/pass-graph-node";
import { RenderGraphBackendAdaptor, NamedAndFormatKeyed, ShadingDetermined, ShadingConstrain } from "./backend-interface";
import { Vector4Like } from "../math/interface";

export type uniformName = string;
type framebufferName = string;

export class RenderPass<
  ShadingType extends ShadingConstrain,
  RenderableType extends ShadingDetermined<ShadingType>,
  FBOType extends NamedAndFormatKeyed>{
  constructor(define: PassDefine<ShadingType>) {
    this.define = define;
    this.name = define.name;
    if (define.shading !== undefined) {
      const overrideShading = define.shading;
      if (overrideShading === undefined) {
        throw `technique '${define.shading}' not defined`
      }
      this.overrideShading = overrideShading;
    }

    this.clearColor = define.clearColor;
    this.enableColorClear = define.enableColorClear === undefined ? true : define.enableColorClear
    this.enableDepthClear = define.enableDepthClear === undefined ? true : define.enableDepthClear

    this.beforePassExecute = define.beforePassExecute;
    this.afterPassExecute = define.afterPassExecute;

  }

  readonly define: PassDefine<ShadingType>;
  public name: string;

  private clearColor: Vector4Like;
  private enableDepthClear: boolean = true;
  private enableColorClear: boolean = true;

  private afterPassExecute?: () => any;
  private beforePassExecute?: () => any;

  private overrideShading: Nullable<ShadingType> = null;

  uniformNameFBOMap: Map<uniformName, framebufferName> = new Map();
  uniformRenderTargetNodeMap: Map<uniformName, RenderTargetNode<ShadingType, RenderableType, FBOType>> = new Map();
  framebuffersDepends: Set<RenderTargetNode<ShadingType, RenderableType, FBOType>> = new Set();

  passNode: PassGraphNode<ShadingType, RenderableType, FBOType>
  // outputInfos
  outputTarget: RenderTargetNode<ShadingType, RenderableType, FBOType>

  get isOutputScreen() {
    return this.outputTarget.isScreenNode;
  }

  renderDebugResult(
    engine: RenderGraphBackendAdaptor<ShadingType, RenderableType, FBOType>,
    framebuffer: FBOType
  ) {
    const debugOutputViewport = this.outputTarget.debugViewPort;
    engine.renderFrameBuffer(framebuffer, debugOutputViewport)
    // this will cause no use draw TODO optimize
    this.uniformNameFBOMap.forEach((inputFramebufferName, uniformName) => {
      const dependFramebuffer = engine.getFramebuffer(inputFramebufferName);
      const debugInputViewport = this.uniformRenderTargetNodeMap.get(uniformName).debugViewPort;
      engine.renderFrameBuffer(dependFramebuffer, debugInputViewport)
    })
  }

  execute(
    engine: RenderGraphBackendAdaptor<ShadingType, RenderableType, FBOType>,
    graph: RenderGraph<ShadingType, RenderableType, FBOType>,
    framebuffer: FBOType
  ) {

    this.checkIsValid();
    let outputTarget: FBOType;

    // setup viewport and render target
    if (this.isOutputScreen) {
      engine.setRenderTargetScreen();
      if (graph.enableDebuggingView) {
        const debugViewPort = graph.screenNode.debugViewPort;
        engine.setViewport(
          debugViewPort.x, debugViewPort.y,
          debugViewPort.z, debugViewPort.w
        );

      } else {
        engine.setFullScreenViewPort();
      }
    } else {
      outputTarget = framebuffer;
      engine.setRenderTarget(outputTarget);
      engine.setViewport(0, 0, this.outputTarget.widthAbs, this.outputTarget.heightAbs);
    }

    // input binding 
    if (this.overrideShading !== null) {
      engine.setOverrideShading(this.overrideShading)
      this.uniformNameFBOMap.forEach((inputFramebufferName, uniformName) => {
        engine.getOverrideShading().defineFBOInput(
          inputFramebufferName, uniformName
        );
      })
    }

    // clear setting
    if (this.enableColorClear) {
      if (this.clearColor !== undefined) {
        engine.setClearColor(this.clearColor);
      }
      engine.clearColor();
    }
    if (this.enableDepthClear) {
      if (!this.isOutputScreen && this.outputTarget.enableDepth) {
        engine.clearDepth();
      }
    }

    if (this.beforePassExecute !== undefined) {
      this.beforePassExecute();
    }

    //////  render //////
    this.define.source.forEach(source => {
      engine.render(source);
    })
    /////////////////////

    if (this.afterPassExecute !== undefined) {
      this.afterPassExecute();
    }

    engine.setOverrideShading(null);
    engine.resetDefaultClearColor();


    if (graph.enableDebuggingView && !this.isOutputScreen) {
      this.renderDebugResult(engine, framebuffer);
    }

  }

  checkIsValid() {
    if (this.isOutputScreen) {
      return
    }
    const target = this.outputTarget.name;
    this.uniformNameFBOMap.forEach(input => {
      if (input === target) {
        throw `you cant output to the render target which is depend on: 
Duplicate target: ${this.outputTarget.name};`
      }
    })
  }
}