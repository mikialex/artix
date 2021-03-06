import {
  ShadingComponent, ShaderFunction, BaseEffectShading,
  ShadingUniform, Matrix4, ShaderGraph, texture, screenQuad, UvFragVary
} from "@artgl/core";
import { unPackDepth } from "@artgl/shader-graph/src/built-in/depth-pack";
import { getWorldPosition, unitDir, NDCxyToUV } from "@artgl/shader-graph/src/built-in/transform";
import { rand2DT, rand } from "@artgl/shader-graph/src/built-in/rand";


const newSamplePosition = new ShaderFunction({
  source: `
  vec3 newPosition(vec3 positionOld, float distance, vec3 dir, float rand){
    return distance * rand * dir + positionOld;
  }
  `
})

const NDCFromWorldPositionAndVPMatrix = new ShaderFunction({
  source: `
  vec3 depthFromWorldPositionAndVPMatrix(vec3 position, mat4 matrix){
    vec4 ndc = matrix * vec4(position, 1.0);
    ndc = ndc / ndc.w;
    return ndc.xyz;
  }
  `
})

const sampleAO = new ShaderFunction({
  source: `
  vec3 sampleAO(float depth, float newDepth){
    if (depth >0.999){
      return vec3(0.5);
    }
    float rate =  depth > newDepth ? 0.0 : 1.0;
    return vec3(rate);
  }
  `
})

const tssaoMix = new ShaderFunction({
  source: `
  vec4 tssaoMix(vec3 oldColor, vec3 newColor, float sampleCount){
    return vec4((oldColor * sampleCount + newColor) / (sampleCount + 1.0), 1.0);
  }
  `
})

@ShadingComponent()
export class TSSAOShading extends BaseEffectShading<TSSAOShading> {
  
  @ShadingUniform("u_sampleCount")
  sampleCount: number = 0;

  @ShadingUniform("VPMatrixInverse")
  VPMatrixInverse: Matrix4 = new Matrix4()

  @ShadingUniform("VPMatrix")
  VPMatrix: Matrix4 = new Matrix4()


  @ShadingUniform("u_aoRadius")
  aoRadius: number = 1

  decorate(graph: ShaderGraph) {
    const VPMatrix = this.getPropertyUniform('VPMatrix')
    const sampleCount = this.getPropertyUniform("sampleCount");
    const depthTex = texture("depthResult");
    graph .setVertexRoot(screenQuad(graph))

    const vUV = graph.getVary(UvFragVary);
    const depth = unPackDepth.make().input("enc", depthTex.fetch(vUV))

    const worldPosition = getWorldPosition.make()
      .input("uv", vUV)
      .input("depth", depth)
      .input("VPMatrix", VPMatrix)
      .input("VPMatrixInverse", this.getPropertyUniform("VPMatrixInverse"))

    const Random2D1 = rand2DT.make()
      .input("cood", vUV)
      .input("t", sampleCount)
    
    const Random2D2 = rand.make()
    .input("n", Random2D1)
    
    const randDir = unitDir.make()
      .input("x", Random2D1)
      .input("y", Random2D2)

    const newPositionRand = newSamplePosition.make()
      .input("positionOld", worldPosition.swizzling("xyz"))
      .input("distance", this.getPropertyUniform("aoRadius"))
      .input("dir", randDir)
      .input("rand", Random2D1)

    const newDepth = unPackDepth.make()
      .input("enc",
        depthTex.fetch(
          NDCxyToUV.make()
            .input(
              "ndc", NDCFromWorldPositionAndVPMatrix.make()
                .input(
                  "position", newPositionRand
                ).input(
                  "matrix", VPMatrix
                )
            )
        )
    )

    graph.setFragmentRoot(
      tssaoMix.make()
        .input("oldColor", texture("AOAcc").fetch(vUV).swizzling("xyz"))
        .input("newColor",
          sampleAO.make()
            .input("depth", depth)
            .input("newDepth", newDepth)
        )
        .input("sampleCount", sampleCount)
    )
  }
}