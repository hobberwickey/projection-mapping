import { Effects } from "./lib/Effects";
import { UI } from "./lib/ScreenUI";

const shaderMethods = {
  pal: `
    vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) 
    {
      return a + b*cos( 6.28318*(c*t+d) );
    }
  `,

  rgb2hsv: `
    vec3 rgb2hsv(vec3 c)
    {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
  `,
};

const vertexShaderSrc = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;

  uniform float u_flipY;
  // uniform mat3 u_matrix;
    
  varying vec2 v_texcoord;
   
  void main() {
    gl_Position = vec4(a_position * vec2(1, u_flipY), 0.0, 1.0);
    // gl_Position = vec4(a_position, 0.0, 1.0);
    v_texcoord = a_texcoord;
  }
`;

const fragmentShader = `
  precision mediump float;
  varying vec2 v_texcoord;
  uniform sampler2D u_texture;

  uniform vec2 u_dimensions;
  uniform mediump float u_opacity;
  uniform vec2 u_effect;

  void main() {
    vec4 color = texture2D(u_texture, v_texcoord);
    gl_FragColor = vec4(color[0], color[1], color[2], u_opacity * color[3]);
  }
`;

class Output {
  constructor(state) {
    this.pending_state = state;
    this.state = state;

    this.videos = new Array(6).fill(null);
    this.contexts = new Array(6).fill(null);
    this.textures = [];
    this.glAttrs = new Array(6).fill(null);
    // this.matrices = [];

    this.scripts = new Array(6).fill(null);

    this.gl = null;
    this.attrs = {
      main: null,

      effects: [],
    };

    this.isPlaying = false;
    this.reset_video = null;

    document.querySelectorAll(".videos video").forEach((vid) => {
      vid.addEventListener("loadedmetadata", (e) => {
        setTimeout(() => {
          this.updateContext(e.target);
          vid.play();
        }, 100);
      });
    });

    this.createContext();
  }

  updateState(state) {
    this.pending_state = state;

    this.setState();
  }

  setState() {
    this.state = this.pending_state;

    let state = this.state;

    for (var i = 0; i < this.state.videos.length; i++) {
      let video = this.state.videos[i];
      let next = state.videos[i];

      for (var j = 0; j < state.effects.length; j++) {
        let effect = Effects.find((e) => e.id === state.effects[j]);
        if (!!effect && effect.id === "video_controls") {
          let prev = video.values[j];
          let curr = next.values[j];

          let vid = this.videos[i];
          if (!!vid) {
            if (prev[0] !== curr[0]) {
              vid.playbackRate = curr[0] * 2;
            } else if (prev[1] !== curr[1]) {
              vid.currentTime =
                (vid.currentTime + vid.duration * (curr[1] - prev[1])) %
                vid.duration;
            }
          }
        }
      }
    }
  }

  play() {
    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.step();
  }

  pause() {
    this.isPlaying = false;
  }

  step() {
    let len = this.videos.length - 1;

    for (let i = 0; i < 6; i++) {
      let script = this.scripts[i];
      if (script !== null) {
        script(this.state);
      }
    }

    for (let i = len; i >= 0; i--) {
      if (this.videos[i] !== null) {
        this.drawFrame(i);
      }
    }

    window.requestAnimationFrame(this.step.bind(this));
  }

  drawFrame(idx) {
    let { videos, shapes } = this.state;

    // Get the context
    let gl = this.gl;
    // Get the attributes
    let attrs = this.attrs;

    // Get the active effect programs
    let effects = [];
    for (var i = 0; i < attrs.effects.length; i++) {
      effects.push(attrs.effects[i]);
    }

    // Get the video and it's HTML element
    let video = videos[idx];
    let videoEl = this.videos[idx];
    let texture = this.textures[idx];

    // Skip if video isn't playing
    if (videoEl.currentTime === 0) {
      return;
    }

    // Draw the video frame for a frame buffer
    this.updateTexture(gl, texture, videoEl);
    // Loop through the effects and draw each to a framebuffer
    let activeBuffer = 0;
    for (let i = 0; i < effects.length; i++) {
      if (!effects[i]) {
        continue;
      }

      gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        texture.attrs.buffers[activeBuffer % 2],
      );
      gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);

      this.drawShapes(
        gl,
        videoEl,
        idx,
        effects[i],
        shapes,
        video.values[i],
        -1,
      );

      gl.bindTexture(gl.TEXTURE_2D, texture.attrs.textures[activeBuffer % 2]);
      activeBuffer++;
    }

    // Draw to the screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, 1280, 720);
    // gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);
    this.drawShapes(gl, videoEl, idx, attrs.main, shapes, [0, 0], 1);
  }

  drawShapes(gl, video, idx, attrs, shapes, values, flip) {
    gl.useProgram(attrs.program);
    gl.uniform2fv(attrs.uniforms.effect, values);
    gl.uniform1f(attrs.uniforms.flip, flip);
    gl.uniform2fv(attrs.uniforms.dimensions, [
      1 / video.videoWidth,
      1 / video.videoHeight,
    ]);

    for (var i = 0; i < shapes.length; i++) {
      let tris = shapes[i].tris;

      for (var j = 0; j < tris.length; j++) {
        // If we're rendering an effect to a frame buffer,
        // use the same points for the input and output
        let pnts = tris[j].input;
        let oPnts = tris[j].input;
        // If we're rendering the final output use the output points
        if (flip === 1) {
          oPnts = tris[j].output;
        }

        let opacity = shapes[i].opacity[idx];

        // Convert from 0,1 to -1,1 coords
        let positions = [
          oPnts[0][0] * 2 - 1,
          oPnts[0][1] * -2 + 1,
          oPnts[1][0] * 2 - 1,
          oPnts[1][1] * -2 + 1,
          oPnts[2][0] * 2 - 1,
          oPnts[2][1] * -2 + 1,
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, attrs.buffers.position);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(positions),
          gl.DYNAMIC_DRAW,
        );

        gl.vertexAttribPointer(
          attrs.locations.position,
          2,
          gl.FLOAT,
          false,
          0,
          0,
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, attrs.buffers.texture);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            pnts[0][0],
            pnts[0][1],
            pnts[1][0],
            pnts[1][1],
            pnts[2][0],
            pnts[2][1],
          ]),
          gl.DYNAMIC_DRAW,
        );

        gl.vertexAttribPointer(
          attrs.locations.texture,
          2,
          gl.FLOAT,
          false,
          0,
          0,
        );
        gl.uniform1f(attrs.uniforms.opacity, opacity);
        gl.uniform1i(attrs.uniforms.sampler, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }
  }

  createShader(gl, type, source) {
    let shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }

    gl.deleteShader(shader);
  }

  createProgram(gl, vShaderSrc, fShaderSrc) {
    let vShader = this.createShader(gl, gl.VERTEX_SHADER, vShaderSrc);
    let fShader = this.createShader(gl, gl.FRAGMENT_SHADER, fShaderSrc);

    let program = gl.createProgram();

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      let positionLocation = gl.getAttribLocation(program, "a_position");
      let positionBuffer = gl.createBuffer();
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      let textureLocation = gl.getAttribLocation(program, "a_texcoord");
      let textureBuffer = gl.createBuffer();
      gl.enableVertexAttribArray(textureLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
      gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, false, 0, 0);

      let attrs = {
        program: program,
        locations: {
          position: positionLocation,
          texture: textureLocation,
        },
        buffers: {
          position: positionBuffer,
          texture: textureBuffer,
        },
        uniforms: {
          sampler: gl.getUniformLocation(program, "u_texture"),
          flip: gl.getUniformLocation(program, "u_flipY"),
          opacity: gl.getUniformLocation(program, "u_opacity"),
          effect: gl.getUniformLocation(program, "u_effect"),
          dimensions: gl.getUniformLocation(program, "u_dimensions"),
        },
      };

      return attrs;
    } else {
      gl.deleteProgram(program);
      return null;
    }
  }

  createContext(idx) {
    let canvas = document.querySelector(".context canvas");
    this.gl = canvas.getContext("webgl");

    this.attrs.main = this.createProgram(
      this.gl,
      vertexShaderSrc,
      fragmentShader,
    );

    this.textures = new Array(6).fill(null).map((t) => {
      return this.initTexture(this.gl);
    });

    if (this.attrs.main !== null) {
      this.gl.clearColor(0, 0, 0, 1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      let effects = this.state.effects;
      for (var i = 0; i < effects.length; i++) {
        let effect = Effects.find((e) => e.id === effects[i]);
        if (!!effect && !!effect.shader) {
          this.attrs.effects.push(
            this.createProgram(this.gl, vertexShaderSrc, effect.shader),
          );
        } else {
          this.attrs.effects.push(null);
        }
      }
    }
  }

  updateContext(video) {
    this.gl.viewport(0, 0, 1280, 720);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  initTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel,
    );

    // Turn off mips and set wrapping to clamp to edge so it
    // will work regardless of the dimensions of the video.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    return {
      src: texture,
      attrs: {
        textures: [],
        buffers: [],
      },
    };
  }

  updateTexture(gl, texture, video) {
    if (video.currentTime === 0) {
      return;
    }

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    const { attrs } = texture;
    if (attrs.textures.length < 2 && attrs.buffers.length < 2) {
      for (let i = 0; i < 2; i++) {
        const bufferTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, bufferTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          srcFormat,
          srcType,
          video,
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        let frameBuffer = this.initFrameBuffer(gl, bufferTexture);

        attrs.textures.push(bufferTexture);
        attrs.buffers.push(frameBuffer);
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, texture.src);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      video,
    );

    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  initFrameBuffer(gl, texture) {
    let frameBuffer = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );

    return frameBuffer;
  }

  resetVideo(idx) {
    this.removeVideo(idx);
    this.reset_video = idx;
  }

  loadVideo(file) {
    if (this.reset_video === null) {
      return;
    }

    let idx = this.reset_video;
    let videos = document.querySelectorAll(".videos video");
    let vid = videos[idx];

    vid.src = URL.createObjectURL(file);

    this.videos[idx] = vid;
    this.reset_video = null;
  }

  removeVideo(idx) {
    let video = this.videos[idx];
    // let gl = this.contexts[idx];

    this.textures[idx] = null;
    this.textures[idx] = this.initTexture(this.gl);

    if (!!video) {
      video.pause();
      video.removeAttribute("src");
      video.load();

      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.videos[idx] = null;
    }
  }

  setEffect(idx, effect) {
    let fx = Effects.find((e) => e.id === effect);

    for (var i = 0; i < this.glAttrs.length; i++) {
      if (this.attrs === null) {
        continue;
      }

      let attrs = this.attrs;
      let gl = this.gl;

      if (!!attrs.effects[idx]) {
        attrs.effects[idx] = null;
      }

      if (!!effect && !!fx.shader) {
        attrs.effects[idx] = this.createProgram(gl, vertexShaderSrc, fx.shader);
      } else {
        attrs.effects[idx] = null;
      }
    }
  }

  setScript(idx, script) {
    let fn = new Function("state", script.code);

    console.log(idx, script, fn);

    this.scripts[idx] = fn;
  }
}

class App {
  constructor() {
    this.ui = null;
    this.output = null;
    this.state = null;

    this.setupListeners();
  }

  setup() {
    this.output.play();
  }

  setState(state) {
    let oldState = this.state;

    this.state = state;
    if (oldState === null) {
      this.output = new Output(this.state);
      this.ui = new UI(this.state);
      this.setup();
    } else {
      this.output.updateState.call(this.output, this.state);
      this.ui.updateState.call(this.ui, this.state);
    }
  }

  setupListeners() {
    window.addEventListener("mousedown", (e) => {
      if (!this.ui) {
        return;
      }

      let { videos, pause } = this.output;

      videos.map((video) => {
        if (video !== null) {
          video.pause();
        }
      });

      this.ui.select(e);
      this.ui.startMove();
    });

    window.addEventListener("mouseup", () => {
      if (!this.ui) {
        return;
      }

      let { videos, play } = this.output;

      videos.map((video, idx) => {
        if (video !== null) {
          video.play();
        }
      });

      this.ui.stopMove();
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.ui) {
        return;
      }

      this.ui.movePoint(e);
    });

    // window.addEventListener("click", (e) => {
    //   if (!this.ui) {
    //     return;
    //   }

    //   this.ui.select(e);
    // });

    window.addEventListener("keydown", (e) => {
      if (e.keyCode === 16) {
        this.ui.shiftDown();
      }

      if (e.keyCode === 39) {
        this.ui.handleRight();
      }

      if (e.keyCode === 37) {
        this.ui.handleLeft();
      }

      if (e.keyCode === 38) {
        this.ui.handleUp();
      }

      if (e.keyCode === 40) {
        this.ui.handleDown();
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.keyCode === 16) {
        this.ui.shiftUp();
      }
    });

    window.addEventListener("keypress", (e) => {
      if (!this.ui) {
        return;
      }

      let { layer, setLayer, drawUI } = this.ui;

      if (e.keyCode === 32) {
        setLayer.call(this.ui, layer === "input" ? "output" : "input");
        drawUI.call(this.ui);
      }
    });

    window.addEventListener("message", (event) => {
      try {
        if (typeof event.data !== "object") {
          let data = JSON.parse(event.data);

          if (data.action === "update_state") {
            this.setState(data.state);
          } else if (data.action === "reset_video") {
            let { videoIdx } = data;
            let { resetVideo } = this.output;

            resetVideo.call(this.output, videoIdx);
          } else if (data.action === "remove_video") {
            let { videoIdx, state } = data;
            let { removeVideo } = this.output;

            removeVideo.call(this.output, videoIdx);
            this.setState(state);
          } else if (data.action === "set_effect") {
            let { effectIdx, effect, state } = data;

            this.output.setEffect.call(this.output, effectIdx, effect);
            this.setState(state);
          } else if (data.action === "set_script") {
            let { scriptIdx, script, state } = data;

            this.output.setScript.call(this.output, scriptIdx, script);
            this.setState(state);
          }
        } else {
          let { loadVideo } = this.output;

          loadVideo.call(this.output, event.data);
        }
      } catch (err) {
        console.log(err);
      }

      // localStorage.setItem("zones", JSON.stringify(this.zones));
    });
  }
}

window.app = null;
window.addEventListener("load", () => {
  window.app = new App();
});
