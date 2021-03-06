import { generateUUID } from "@artgl/math";
import { RenderTargetNode } from "./node/render-target-node";
import { RenderGraphBackEnd, FBOProvider } from "./interface"

type formatKey = string;
type FBOGeneratedName = string;

/**
 * Proxy the fbo storage in rendergraph
 */
export class FrameBufferPool {
  constructor(engine: RenderGraphBackEnd) {
    this.engine = engine;

    // when resize, clear all for convenience, TODO, optimize
    // maybe we can mark fbo size dynamic, update(resize) dynamic first
    this.engine.hookResize(() => {this.clearAll();})
  }

  private engine: RenderGraphBackEnd;

  framebuffers: Map<FBOGeneratedName, FBOProvider> = new Map();

  availableBuffers: Map<formatKey, FBOProvider[]> = new Map();

  clearAll() {
    this.framebuffers.forEach(buffer => {
      this.engine.deleteFramebuffer(buffer)
    })
    this.framebuffers.clear();
    this.availableBuffers.clear();
  }

  /**
   * get a FBOProvider from pool, 
   * if there is no fbo meet the config, 
   * create a new one, and pool it
   */
  requestFramebuffer(node: RenderTargetNode): FBOProvider {
    const pooled = this.availableBuffers.get(node.formatKey);
    if (pooled !== undefined) {
      const result = pooled.pop()!;
      if (pooled.length === 0) {
        this.availableBuffers.delete(node.formatKey);
      }
      return result;
    }

    const FBOName = generateUUID();
    const newFBO = this.engine.createFramebuffer(
      FBOName, node.widthAbs, node.heightAbs, node.enableDepth);

    this.framebuffers.set(FBOName, newFBO);

    return newFBO;
  }

  /**
   * return a framebuffer that maybe request before, which will be pooling and reused 
   */
  returnFramebuffer(framebuffer: FBOProvider) {
    if (!this.framebuffers.has(framebuffer.name)) {
      throw 'cant return a framebuffer not belong to this pool'
    }

    let poolList = this.availableBuffers.get(framebuffer.getFormatKey());
    if (poolList === undefined) {
      poolList = [];
      this.availableBuffers.set(framebuffer.getFormatKey(), poolList);
    }
    poolList.push(framebuffer)
  }

}