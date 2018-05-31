import { GLShader, GLProgramConfig, ShaderType } from "./shader";
import { GLInfo } from "./webgl/gl-info";

export class GLRenderer {
  constructor(el: HTMLCanvasElement, options?: any) {
    this.gl = el.getContext('webgl', options);
    this.glInfo = new GLInfo(this);
    this.glInfo.createAllExtension();
  }
  gl: WebGLRenderingContext;
  glInfo: GLInfo;

  program: GLProgram

  render() {
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
  
}




export class GLProgram {
  constructor(renderer: GLRenderer, config: GLProgramConfig) {
    this.renderer = renderer;
    renderer.program = this;
    this.createShaders(config);
    this.createProgram(this.vertexShader, this.fragmentShader);
    this.populateDataSlot(config);
    this.config = config;
  }
  private renderer: GLRenderer;
  private program: WebGLProgram;
  private config: GLProgramConfig;
  private attributes = {};
  private uniforms = {};
  private vertexShader: GLShader;
  private fragmentShader: GLShader;

  private createShaders(conf: GLProgramConfig) {
    this.vertexShader = new GLShader(this.renderer);
    this.vertexShader.compileRawShader(conf.vertexShaderString, ShaderType.vertex);
    this.fragmentShader = new GLShader(this.renderer);
    this.fragmentShader.compileRawShader(conf.fragmentShaderString, ShaderType.fragment);
  }

  private createProgram(vertexShader: GLShader, fragmentShader: GLShader) {
    const gl = this.renderer.gl;
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader.shader);
    gl.attachShader(this.program, fragmentShader.shader);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      let info = gl.getProgramInfoLog(this.program);
      throw 'Could not compile WebGL program. \n\n' + info;
    } else {
      gl.useProgram(this.program);
    }
  }

  private populateDataSlot(config: GLProgramConfig) {
    const gl = this.renderer.gl;
    config.attributes.forEach(att => {
      this.attributes[att.name] = {
        name: att.name,
        data: null,
        position: gl.getAttribLocation(this.program, att.name),
        discriptor: att
      }
    })
    config.uniforms.forEach(uni => {
      this.uniforms[uni.name] = {
        name: uni.name,
        data: null,
        position: gl.getUniformLocation(this.program, uni.name),
        discriptor: uni
      }
    })
  }

  setAttribute(name: string, data: any) {
    const conf = this.attributes[name];
    if (!conf) {
      throw 'try to set a none exist attribute';
    }
    const gl = this.renderer.gl;
    const buffer = gl.createBuffer();
    const position = conf.position;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(position, conf.discriptor.stride, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position);
  }

  setUniform(name: string, data: any) {
    const conf = this.uniforms[name];
    if (!conf) {
      throw 'try to set a none exist unifrom';
    }
    const gl = this.renderer.gl;
    const position = conf.position;
    gl.uniform1f(position, data);
  }
}
