import { Observable } from "./observable";
import {
  ShaderUniformProvider, ShaderUniformDecorator, getPropertyUniform, ProviderUploadCache
} from "./shading";
import { ShaderGraph } from "../shader-graph/shader-graph";
import { ShaderUniformInputNode, ShaderTextureNode } from "../shader-graph/shader-node";
import { CubeTexture } from "./texture-cube";
import { Texture } from "../artgl";
import { textureFromValue } from "../shader-graph/node-maker";

export abstract class BaseEffectShading<T>
  implements ShaderUniformProvider, ShaderUniformDecorator {

  shouldProxyedByUBO = true;
  abstract decorate(graph: ShaderGraph): void;

  foreachProvider(visitor: (p: ShaderUniformProvider) => any) {
    return visitor(this);
  }

  notifyNeedRedecorate: Observable<ShaderUniformDecorator> = new Observable();
  uploadCache!: ProviderUploadCache

  nodeCreated: Map<string, ShaderUniformInputNode> = new Map();
  textureNodeCreated: Map<string, ShaderTextureNode> = new Map();

  getPropertyUniform(name: keyof T): ShaderUniformInputNode {
    return getPropertyUniform(this, name)
  }

  getPropertyTexture(name: keyof T): ShaderTextureNode {
    const textureNode = this.textureNodeCreated.get(name as string);
    if (textureNode !== undefined) {
      return textureNode;
    }
    const textureName = this.propertyUniformNameMap.get(name as string);
  
    if (textureName === undefined) {
      throw `${name} uniform name not found, maybe forget decorator`
    }
  
    const value = (this as unknown as T)[name];
    if (value === undefined) {
      throw "texture value not given"
    }
    const node = textureFromValue(textureName, value as unknown as Texture | CubeTexture);
    this.textureNodeCreated.set(name as string, node);
    return node;
  }

}
