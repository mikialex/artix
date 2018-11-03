import { Material, standradMeshAttributeLayout } from "../core/material";
import { GLDataType } from "../webgl/shader-util";
import { GLRenderer } from "../renderer/webgl-renderer";
import { Matrix4 } from "../math";
import { AttributeUsage } from "../webgl/attribute";

const vertexShaderSource =
  `
    void main() {
      vec4 worldPosition = MVPMatrix * worldMatrix * vec4(position, 1.0);
      gl_Position = worldPosition;
    }
    ` 
const fragmentShaderSource =
  `
    void main() {
      gl_FragColor = vec4(0.5,0.5,0.5,1.0);
    }
    `


export class TestMaterial extends Material{
  constructor() {
    super();
  }

  createProgram(renderer: GLRenderer) {
    return renderer.createProgram({
      attributes: [
        { name: 'position', type: GLDataType.floatVec3, usage: AttributeUsage.position, stride: 3 },
        // { name: 'normal', type: GLDataType.floatVec3, usage: AttributeUsage.normal, stride: 3 },
        // { name: 'uv', type: GLDataType.floatVec2, usage: AttributeUsage.uv, stride: 2 },
      ],
      uniforms: [
        { name: 'worldMatrix', type: GLDataType.Mat4 , default: new Matrix4()},
        { name: 'MVPMatrix', type: GLDataType.Mat4, default: new Matrix4()},
      ],
      vertexShaderString: vertexShaderSource,
      fragmentShaderString: fragmentShaderSource,
      autoInjectHeader: true,
    });
  }
}