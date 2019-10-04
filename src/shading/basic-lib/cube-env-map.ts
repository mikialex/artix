import { shader } from "../../shader-graph/shader-function"
import { BaseEffectShading, ShaderGraph, cubeTexture, WorldPositionFragVary } from "../../artgl"

const sampleEnvMapAndNeedNormalize = shader(`
vec4 sampleEnvMap(samplerCube envMap, vec3 dir){
  return textureCube(envMap, normalize(dir));
}
`)

export class CubeEnvMapShading extends BaseEffectShading<CubeEnvMapShading> {

  decorate(graph: ShaderGraph): void {
    graph
      .setFragmentRoot(
        sampleEnvMapAndNeedNormalize.make()
          .input("envMap", cubeTexture('envMap'))
          .input("dir", graph.getVary(WorldPositionFragVary))
      )
  }

}