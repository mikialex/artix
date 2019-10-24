import { GLReleasable, Nullable } from "../type";
import { GLRenderer } from "./gl-renderer";
import { ShaderUniformProvider } from "../core/shading";

export class GLUBOManager implements GLReleasable {
  constructor(renderer: GLRenderer) {
    if (renderer.ctxVersion !== 2) {
      throw 'WebGL UBO only support webgl2 context'
    }
    this.gl = renderer.gl as WebGL2RenderingContext;
  }

  private gl: WebGL2RenderingContext;

  private bindingPoints: Nullable<WebGLBuffer>[] = [];

  private UBOData: Map<ShaderUniformProvider, WebGLBuffer> = new Map();
  private UBOVersionMap: Map<ShaderUniformProvider, number> = new Map();

  bindProviderTo(provider: ShaderUniformProvider, bindPoint: number) {
    const ubo = this.getUBO(provider);
    this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, ubo);// todo
  }

  createUBO(provider: ShaderUniformProvider) {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    if (buffer === null) {
      throw 'Webgl create buffer failed for UBO';
    }
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    gl.bufferData(gl.UNIFORM_BUFFER, provider.uniformsByteSizeAll, gl.STATIC_DRAW);
    let offset = 0;
    // js map iterator is insert order
    provider.uniforms.forEach((value) => {
      const data = value.getTypedArrayData();
      gl.bufferSubData(gl.UNIFORM_BUFFER, offset, data);
      offset += data.byteLength;
    });
    return buffer;
  }

  getUBO(provider: ShaderUniformProvider) {
    const ubo = this.UBOData.get(provider);
    if (ubo === undefined) {
      return this.createUBO(provider);
    } else {
      if (provider._version !== this.UBOVersionMap.get(provider)) {
        this.deleteUBO(provider, ubo);
        return this.createUBO(provider);
      } else {
        return ubo;
      }
    }
  }

  deleteProviderUBO(provider: ShaderUniformProvider) {
    const buffer = this.UBOData.get(provider);
    if (buffer !== undefined) {
      this.deleteUBO(provider, buffer);
    }
  }

  private deleteUBO(provider: ShaderUniformProvider, buffer: WebGLBuffer) {
    this.gl.deleteBuffer(buffer);
    this.UBOData.delete(provider);
    this.UBOVersionMap.delete(provider);
  }

  releaseGL(): void {
    this.UBOData.forEach(buffer => {
      this.gl.deleteBuffer(buffer);
    })
    this.UBOData.clear();
    this.UBOVersionMap.clear();
    this.bindingPoints = this.bindingPoints.map(_ => null);
  }
}