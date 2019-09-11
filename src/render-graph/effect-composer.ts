import { PassGraphNode, RenderGraph, RenderEngine } from "../artgl";
import { FrameBufferPool } from "./framebuffer-pool";
import { RenderPass } from "./pass";
import { RenderTargetNode } from "./node/render-target-node";
import { GLFramebuffer } from '../webgl/gl-framebuffer';

/**
 * Responsible for rendergraph execution and optimization
 */
export class EffectComposer {
  constructor(engine: RenderEngine) {
    this.engine = engine;
    this.framebufferPool = new FrameBufferPool(this.engine);

    this.engine.resizeObservable.add(() => {
      this.keptFramebuffer.clear();
    })
  }

  hasAllPassIsValidChecked = false;

  private engine: RenderEngine;
  private passes: RenderPass[] = [];
  
  private framebufferPool: FrameBufferPool;

  private keptFramebuffer: Map<RenderTargetNode, GLFramebuffer> = new Map();
  private framebufferDropList: RenderTargetNode[][] = [];

  getFramebuffer(node: RenderTargetNode) {
    return this.keptFramebuffer.get(node)
  }

  render(engine: RenderEngine, enableGraphDebugging: boolean = false) {
    this.passes.forEach((pass, index) => {
      const output = pass.outputTarget;
      output.updateSize(engine);
      let framebuffer: GLFramebuffer = this.keptFramebuffer.get(output)!

      if (framebuffer === undefined) {
        framebuffer = this.framebufferPool.requestFramebuffer(output)
      }

      pass.uniformRenderTargetNodeMap.forEach((targetDepend, uniformName) => {
        let inputFBO = this.keptFramebuffer.get(targetDepend);

        // if input not exist, its never initialized(empty fbo). created now!
        if (inputFBO === undefined) {
          targetDepend.updateSize(engine);
          inputFBO = this.framebufferPool.requestFramebuffer(targetDepend)
          this.keptFramebuffer.set(targetDepend, inputFBO);
        }

        pass.uniformNameFBOMap.set(uniformName, inputFBO.name)
      })
    
      if (!this.hasAllPassIsValidChecked) {
        pass.checkIsValid(); 
      }
      pass.execute(engine, framebuffer, enableGraphDebugging);

      this.keptFramebuffer.set(output, framebuffer);

      this.framebufferDropList[index].forEach(target => {
        this.framebufferPool.returnFramebuffer(this.keptFramebuffer.get(target)!)
        this.keptFramebuffer.delete(target)
      })

    });
    this.hasAllPassIsValidChecked = true;
  }

  setPasses(passes: RenderPass[]) {
    this.passes = passes;
    this.hasAllPassIsValidChecked = false;

    // compute dropList
    this.framebufferDropList = [];
    for (let i = 0; i < this.passes.length; i++) {
      this.framebufferDropList.push([])
    }

    passes.forEach((pass, index) => {

      const targetCreated = pass.outputTarget!;
      if (targetCreated.isScreenNode) {
        return;
      }

      if (targetCreated._keepContent) {
        return;
      }
      for (let i = passes.length - 1; i > index; i--) {
        const passMaybeUsed = passes[i];
        if (passMaybeUsed.framebuffersDepends.has(targetCreated)) {
          this.framebufferDropList[i].push(targetCreated)
          return;
        }
      }
    })

  }

  clear() {
    this.passes = [];
    this.framebufferDropList = [];
    this.keptFramebuffer.clear();
  }

}