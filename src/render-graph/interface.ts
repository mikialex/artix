import { Vector4 } from "../math/vector4";

export enum PixelFormat {
  depth,
  rgba
}

export enum DimensionType {
  bindRenderSize,
  fixed
}

export interface RenderTextureDefine {
  name: string,
  format: {
    pixelFormat: PixelFormat,
    dimensionType: DimensionType,
    width?: number,
    height?: number,
    disableDepthBuffer?: boolean
  }
}

export interface SourceDefine {
  name: string,
  from: string,
  filter?: () => boolean,
  transformer?: () => void,
  sorter?: () => number,
}

enum stateType {
  DisableColorWrite,
  DisableAlphaWrite
}

export interface PassInputMapInfo{
  name: string,
  mapTo: string
}

export interface PassDefine {
  name: string,
  inputs?: PassInputMapInfo[],
  output: string,
  source: string[],
  filter?: () => boolean,
  sorter?: () => number,
  states?: stateType[],
  technique?: string,
  enableColorClear?:boolean,
  enableDepthClear?:boolean,
  clearColor?: Vector4,
  afterPassExecute?: () => any,
  beforePassExecute?: () => any,
}

export interface GraphDefine {
  passes: PassDefine[],
  renderTextures?: RenderTextureDefine[];
}