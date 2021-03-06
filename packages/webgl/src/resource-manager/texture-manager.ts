import { GLRenderer } from "../gl-renderer";
import { FramebufferAttachTexture } from "../gl-framebuffer";
import { GLTextureSlot } from "../states/gl-texture-slot";
import { GLTextureTypeRaw, TextureFilter, TextureWrap } from "../const";
import {
  WebGLTextureProvider, GLReleasable, WebGLCubeTextureProvider,
  WebGLCommonTextureProvider, TextureBehaviorDescriptor
} from "../interface"
import { TextureSource } from "@artgl/shared";


const defaultRenderTargetTextureDescriptor = {
  minFilter: TextureFilter.nearest,
  magFilter: TextureFilter.nearest,
  wrapS: TextureWrap.clampToEdge,
  wrapT: TextureWrap.clampToEdge,
}



/**
 * responsible for webgl texture resource allocation and reallocation
 * outside request create webgl texture from given source or description
 * 
 * @export
 * @class GLTextureManager
 */
export class GLTextureManager implements GLReleasable {
  constructor(renderer: GLRenderer) {
    this.renderer = renderer;
    this.slotManager = renderer.state.textureSlot;
    const gl = this.renderer.gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }
  readonly renderer: GLRenderer;
  private slotManager: GLTextureSlot;
  private textures: Map<WebGLTextureProvider, WebGLTexture> = new Map();
  texturesVersion: Map<WebGLTextureProvider, number> = new Map();

  getGLTexture(texture: WebGLTextureProvider) {
    return this.textures.get(texture);
  }

  deleteGLTexture(texture: WebGLTextureProvider) {
    const glTexture = this.getGLTexture(texture);
    if (glTexture === undefined) {
      return
    }
    this.renderer.gl.deleteTexture(glTexture);
    this.textures.delete(texture);
    this.texturesVersion.delete(texture);
  }

  createTextureForRenderTarget(texture: FramebufferAttachTexture) {
    const gl = this.renderer.gl;
    const glTexture = this.createEmptyWebGLTexture()
    this.updateTextureParameters(glTexture, defaultRenderTargetTextureDescriptor, gl.TEXTURE_2D)

    this.slotManager.bindTexture(gl.TEXTURE_2D, glTexture);
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat,
      texture.width, texture.height, border,
      format, type, data);

    this.textures.set(texture, glTexture);

    return glTexture;
  }

  private updateTextureParameters(
    glTexture: WebGLTexture,
    description: TextureBehaviorDescriptor,
    bindType: GLTextureTypeRaw
  )
    : WebGLTexture {
    const gl = this.renderer.gl;
    this.slotManager.bindTexture(bindType, glTexture);
    gl.texParameteri(bindType, gl.TEXTURE_MIN_FILTER, description.minFilter);
    gl.texParameteri(bindType, gl.TEXTURE_MIN_FILTER, description.magFilter);
    gl.texParameteri(bindType, gl.TEXTURE_WRAP_S, description.wrapS);
    gl.texParameteri(bindType, gl.TEXTURE_WRAP_T, description.wrapT);
    return glTexture
  }

  private createEmptyWebGLTexture(): WebGLTexture {
    const gl = this.renderer.gl;
    const glTexture = gl.createTexture();
    if (glTexture === null) {
      throw 'webgl texture create fail';
    }
    return glTexture
  }

  createWebGLCubeTexture(texture: WebGLCubeTextureProvider): WebGLTexture {
    const gl = this.renderer.gl;

    const glTexture = this.createEmptyWebGLTexture();
    this.updateTextureParameters(glTexture, texture, gl.TEXTURE_CUBE_MAP)

    const level = 0;
    const internalFormat = gl.RGBA;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      level, internalFormat, format, type, texture.getPositiveXMap());
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      level, internalFormat, format, type, texture.getPositiveYMap());
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      level, internalFormat, format, type, texture.getPositiveZMap());
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      level, internalFormat, format, type, texture.getNegativeXMap());
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      level, internalFormat, format, type, texture.getNegativeYMap());
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      level, internalFormat, format, type, texture.getNegativeZMap());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    this.textures.set(texture, glTexture);
    this.texturesVersion.set(texture, texture.getVersion())
    return glTexture;
  }

  createWebGLTexture(texture: WebGLCommonTextureProvider): WebGLTexture {
    const gl = this.renderer.gl;
    const glTexture = this.createEmptyWebGLTexture();
    this.updateTextureParameters(glTexture, texture, gl.TEXTURE_2D)
    const renderUsedDataSource = texture.getRenderUsedDataSource(this.renderer.ctxVersion === 2);
    if (texture.isDataTexture) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
        renderUsedDataSource.width, renderUsedDataSource.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, renderUsedDataSource.source as ArrayBufferView);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D, 0,
        gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE,
        renderUsedDataSource.source as TexImageSource);
    }

    this.textures.set(texture, glTexture);
    this.texturesVersion.set(texture, texture.getVersion())
    return glTexture;
  }

  uploadWebGLMipMap(glTexture: WebGLTexture) {
    const gl = this.renderer.gl;
    this.slotManager.bindTexture(gl.TEXTURE_2D, glTexture);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  uploadCustomMipMap(_glTexture: WebGLTexture, _sources: TextureSource[]) {
    // TODO
  }

  releaseGL() {
    this.textures.forEach(t => {
      this.renderer.gl.deleteTexture(t);
    })
    this.slotManager.resetSlotIndex();
    this.textures = new Map();
    this.texturesVersion = new Map();
  }
}
