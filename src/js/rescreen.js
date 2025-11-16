import { Effects } from "./lib/Effects";
import { UI } from "./lib/ScreenUI";
import { ScriptTemplate } from "./lib/ScriptTemplate";
import { Config } from "./lib/Config";

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

  varying vec2 v_texcoord;
  
  void main() {
    gl_Position = vec4(a_position * vec2(1, u_flipY), 0.0, 1.0);
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

  // For quads
  uniform float u_quad;
  uniform vec2 u_translate;
  uniform vec2 u_scale;
  
  uniform vec2 u_vertex_a;
  uniform vec2 u_vertex_b;
  uniform vec2 u_vertex_c;
  uniform vec2 u_vertex_d;

  
  // Credit to https://www.shadertoy.com/view/lsBSDm for the invBilinear function
  float cross2d( in vec2 a, in vec2 b ) { 
    return a.x*b.y - a.y*b.x; 
  }

  vec2 invBilinear( in vec2 p, in vec2 a, in vec2 b, in vec2 c, in vec2 d ) {
    vec2 res = vec2(-1.0);

    vec2 e = b-a;
    vec2 f = d-a;
    vec2 g = a-b+c-d;
    vec2 h = p-a;
        
    float k2 = cross2d( g, f );
    float k1 = cross2d( e, f ) + cross2d( h, g );
    float k0 = cross2d( h, e );
    
    if( abs(k2)<0.001 ) {
        res = vec2( (h.x*k1+f.x*k0)/(e.x*k1-g.x*k0), -k0/k1 );
    } else {
      float w = k1*k1 - 4.0*k0*k2;
      if ( w<0.0 ) return vec2(-1.0);
      w = sqrt( w );

      float ik2 = 0.5/k2;
      float v = (-k1 - w)*ik2;
      float u = (h.x - f.x*v)/(e.x + g.x*v);
      
      if( u<0.0 || u>1.0 || v<0.0 || v>1.0 ) {
        v = (-k1 + w)*ik2;
        u = (h.x - f.x*v)/(e.x + g.x*v);
      }
      res = vec2( u, v );
    }
    
    return res;
  }

  void main() {
    vec2 coords;

    if (u_quad == 1.0) {
      vec2 lerped = invBilinear(v_texcoord, u_vertex_a, u_vertex_b, u_vertex_c, u_vertex_d);
      vec2 scaled = vec2(lerped[0] * u_scale[0], lerped[1] * u_scale[1]);
      vec2 translated = vec2(scaled[0] + u_translate[0], scaled[1] + u_translate[1]);

      coords = translated;
    } else {
      coords = v_texcoord;
    }

    
    vec4 color = texture2D(u_texture, coords);
    gl_FragColor = vec4(color[0], color[1], color[2], u_opacity * color[3]);
  }
`;

class Output {
  constructor(state) {
    this.pending_state = state;
    this.state = state;
    this.registry = { elapsed: 1 };

    this.epoch = Date.now();
    this.bpm = 0;
    this.beat = [0, 0];
    this.timing = [0, 0];

    this.defaultClock = null;
    this.pulseCount = 0;
    this.beatStart = null;
    this.beatTick = false;
    this.resetBeat = false;

    this.videos = new Array(6).fill(null);
    this.scripts = [];
    this.effects = [];

    this.textures = [];
    this.glAttrs = new Array(6).fill(null);

    this.gl = null;
    this.clock = null;

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
    this.updateSlots(this.state);
  }

  updateState(state) {
    this.pending_state = state;

    this.setState();
  }

  setEffectOrder() {
    let effects = Effects.map((e) => e.id);
    let used = [...this.state.effects].filter((e) => !!e);
    let unused = effects.reduce((a, c) => {
      if (!used.includes(c)) {
        a.push(c);
      }

      return a;
    }, []);

    // console.log(effects, used, unused);
    // console.log([...used, ...unused]);
  }

  setState() {
    this.state = this.pending_state;

    let state = this.state;

    for (var i = 0; i < this.state.videos.length; i++) {
      let video = this.state.videos[i];
      let next = state;

      // for (var j = 0; j < state.effects.length; j++) {
      //   let effect = Effects.find((e) => e.id === state.effects[j]);
      //   if (!!effect && effect.id === "video_controls") {
      //     let prev = state.values.effects[i][j];
      //     let curr = next.values.effects[i][j];

      //     let vid = this.videos[i];
      //     if (!!vid) {
      //       if (prev[0] !== curr[0]) {
      //         vid.playbackRate = curr[0] * 2;
      //       } else if (prev[1] !== curr[1]) {
      //         vid.currentTime =
      //           (vid.currentTime + vid.duration * (curr[1] - prev[1])) %
      //           vid.duration;
      //       }
      //     }
      //   }
      // }
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
    let start = Date.now();
    let len = this.videos.length - 1;
    let state = JSON.parse(JSON.stringify(this.state));
    let beat = this.beatTick ? this.beat : null;

    state.elapsed = Date.now() - this.epoch;
    state.bpm = this.bpm;
    state.beat = beat;
    state.timing = this.timing;
    state.elements = this.videos;

    for (let i = 0; i < state.scripts.length; i++) {
      let script = this.scripts[i];
      let slot = state.scripts[i].slot;
      let values = slot.script.values;
      let disabled = slot.disabled;

      if (!disabled) {
        try {
          script(state, values[0], values[1], slot.id, this.registry);
        } catch (e) {
          console.log(e);
        }
      }
    }

    this.beatTick = false;
    this.registry.elapsed = state.elapsed;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.drawFrame(state);

    window.requestAnimationFrame(this.step.bind(this));
  }

  drawFrame(state) {
    let effects = this.effects;

    let { videos, shapes, slots } = state;

    // Get the context
    let gl = this.gl;
    // Get the attributes
    let attrs = this.attrs;
    let videosLen = this.videos.length - 1;
    // let activeBuffer = 1;
    let activeBuffers = new Array(this.videos.length).fill(0);

    for (var j = videosLen; j >= 0; j--) {
      let video = videos[j];
      let videoEl = this.videos[j];
      let texture = this.textures[j];

      // Skip if video isn't playing
      if (videoEl === null || videoEl.currentTime === 0) {
        continue;
      }

      this.updateTexture(gl, texture, videoEl);
    }

    // First draw the texture to the first frame buffer
    for (var j = videosLen; j >= 0; j--) {
      let video = videos[j];
      let vals = [0, 0];
      let videoEl = this.videos[j];
      let texture = this.textures[j];

      // Skip if video isn't playing
      if (videoEl === null || videoEl.currentTime === 0) {
        continue;
      }

      gl.bindTexture(gl.TEXTURE_2D, texture.src);
      gl.bindFramebuffer(gl.FRAMEBUFFER, texture.attrs.buffers[0]);
      gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);
      gl.useProgram(attrs.main.program);
      this.drawShapes(gl, videoEl, j, attrs.main, shapes, [0, 0], -1);
    }

    for (var i = 0; i < effects.length; i++) {
      gl.useProgram(effects[i].program);

      for (var j = videosLen; j >= 0; j--) {
        let video = videos[j];
        let vals = [...state.effects[i].slot.values[j]];
        let videoEl = this.videos[j];
        let texture = this.textures[j];

        // Skip if this effect isn't being used
        if (vals[0] === 0 && vals[1] === 0) {
          continue;
        }

        // Skip if video isn't playing
        if (videoEl === null || videoEl.currentTime === 0) {
          continue;
        }

        let activeBuffer = activeBuffers[j];
        let drawBuffer = (activeBuffer + 1) % 2;

        gl.bindTexture(gl.TEXTURE_2D, texture.attrs.textures[activeBuffer]);

        gl.bindFramebuffer(gl.FRAMEBUFFER, texture.attrs.buffers[drawBuffer]);
        gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.drawShapes(gl, videoEl, j, effects[i], shapes, vals, -1);

        activeBuffers[j] = drawBuffer;
      }
    }

    for (var j = videosLen; j >= 0; j--) {
      let video = videos[j];
      let vals = [0, 0];
      let videoEl = this.videos[j];
      let texture = this.textures[j];

      // Skip if video isn't playing
      if (videoEl === null || videoEl.currentTime === 0) {
        continue;
      }

      gl.bindTexture(gl.TEXTURE_2D, texture.attrs.textures[activeBuffers[j]]);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, 1280, 720);
      // gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);
      gl.useProgram(attrs.main.program);
      this.drawShapes(gl, videoEl, j, attrs.main, shapes, [0, 0], 1);
    }
  }

  drawShapes(gl, video, idx, attrs, shapes, values, flip) {
    // gl.useProgram(attrs.program);
    gl.uniform2fv(attrs.uniforms.effect, values);
    gl.uniform1f(attrs.uniforms.flip, flip);
    gl.uniform2fv(attrs.uniforms.dimensions, [
      1 / video.videoWidth,
      1 / video.videoHeight,
    ]);

    for (var i = 0; i < shapes.length; i++) {
      let opacity = shapes[i].opacity[idx];

      if (opacity === 0) {
        continue;
      }

      let tris = shapes[i].tris;

      if (flip === 1 && shapes[i].type === "quad") {
        let vert_a = [tris[0].output[0][0], tris[0].output[0][1]];
        let vert_b = [tris[0].output[1][0], tris[0].output[1][1]];
        let vert_c = [tris[0].output[2][0], tris[0].output[2][1]];
        let vert_d = [tris[1].output[2][0], tris[1].output[2][1]];

        let translate = [tris[0].input[0][0], tris[0].input[0][1]];
        let scale = [
          tris[0].input[1][0] - tris[0].input[0][0],
          tris[0].input[2][1] - tris[0].input[1][1],
        ];

        gl.uniform1f(attrs.uniforms.quad, 1);
        gl.uniform2fv(attrs.uniforms.vert_a, vert_a);
        gl.uniform2fv(attrs.uniforms.vert_b, vert_b);
        gl.uniform2fv(attrs.uniforms.vert_c, vert_c);
        gl.uniform2fv(attrs.uniforms.vert_d, vert_d);

        gl.uniform2fv(attrs.uniforms.translate, translate);
        gl.uniform2fv(attrs.uniforms.scale, scale);
      } else {
        gl.uniform1f(attrs.uniforms.quad, 0);
      }

      for (var j = 0; j < tris.length; j++) {
        // If we're rendering an effect to a frame buffer,
        // use the same points for the input and output
        let pnts = tris[j].input;
        let oPnts = tris[j].input;
        // If we're rendering the final output use the output points
        if (flip === 1) {
          if (shapes[i].type === "quad") {
            pnts = tris[j].output;
          }

          oPnts = tris[j].output;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, attrs.buffers.position);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            oPnts[0][0] * 2 - 1,
            oPnts[0][1] * -2 + 1,
            oPnts[1][0] * 2 - 1,
            oPnts[1][1] * -2 + 1,
            oPnts[2][0] * 2 - 1,
            oPnts[2][1] * -2 + 1,
          ]),
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

  // _drawFrame(idx, state) {
  //   let { videos, shapes, values } = state;

  //   // Get the context
  //   let gl = this.gl;
  //   // Get the attributes
  //   let attrs = this.attrs;

  //   // Get the active effect programs
  //   let effects = [];
  //   for (var i = 0; i < attrs.effects.length; i++) {
  //     effects.push(attrs.effects[i]);
  //   }

  //   // Get the video and it's HTML element
  //   let video = videos[idx];
  //   let vals = values.effects[idx];
  //   let videoEl = this.videos[idx];
  //   let texture = this.textures[idx];

  //   // Skip if video isn't playing
  //   if (videoEl.currentTime === 0) {
  //     return;
  //   }

  //   // Clear the frame buffers
  //   // for (let i = 0; i < 2; i++) {
  //   //   gl.bindFramebuffer(gl.FRAMEBUFFER, texture.attrs.buffers[i]);
  //   //   gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);

  //   //   gl.clearColor(0, 0, 0, 0);
  //   //   gl.clear(gl.COLOR_BUFFER_BIT);
  //   // }

  //   // Draw the video frame for a frame buffer
  //   this.updateTexture(gl, texture, videoEl);

  //   let activeBuffer = 1;
  //   for (let i = 0; i < effects.length; i++) {
  //     if (!effects[i]) {
  //       continue;
  //     }

  //     if (vals[i][2] === 1) {
  //       continue;
  //     }

  //     activeBuffer = (activeBuffer + 1) % 2;

  //     gl.bindFramebuffer(gl.FRAMEBUFFER, texture.attrs.buffers[activeBuffer]);
  //     gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);

  //     gl.clearColor(0, 0, 0, 0);
  //     gl.clear(gl.COLOR_BUFFER_BIT);

  //     this.drawShapes(gl, videoEl, idx, effects[i], shapes, vals[i], -1);

  //     gl.bindTexture(gl.TEXTURE_2D, texture.attrs.textures[activeBuffer]);
  //   }

  //   // Draw to the screen
  //   gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  //   gl.viewport(0, 0, 1280, 720);
  //   // gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);
  //   this.drawShapes(gl, videoEl, idx, attrs.main, shapes, [0, 0], 1);
  // }

  // _drawShapes(gl, video, idx, attrs, shapes, values, flip) {
  //   gl.useProgram(attrs.program);
  //   gl.uniform2fv(attrs.uniforms.effect, values);
  //   gl.uniform1f(attrs.uniforms.flip, flip);
  //   gl.uniform2fv(attrs.uniforms.dimensions, [
  //     1 / video.videoWidth,
  //     1 / video.videoHeight,
  //   ]);

  //   for (var i = 0; i < shapes.length; i++) {
  //     let tris = shapes[i].tris;

  //     if (flip === 1 && shapes[i].type === "quad") {
  //       let vert_a = [tris[0].output[0][0], tris[0].output[0][1]];
  //       let vert_b = [tris[0].output[1][0], tris[0].output[1][1]];
  //       let vert_c = [tris[0].output[2][0], tris[0].output[2][1]];
  //       let vert_d = [tris[1].output[2][0], tris[1].output[2][1]];

  //       let translate = [tris[0].input[0][0], tris[0].input[0][1]];
  //       let scale = [
  //         tris[0].input[1][0] - tris[0].input[0][0],
  //         tris[0].input[2][1] - tris[0].input[1][1],
  //       ];

  //       gl.uniform1f(attrs.uniforms.quad, 1);
  //       gl.uniform2fv(attrs.uniforms.vert_a, vert_a);
  //       gl.uniform2fv(attrs.uniforms.vert_b, vert_b);
  //       gl.uniform2fv(attrs.uniforms.vert_c, vert_c);
  //       gl.uniform2fv(attrs.uniforms.vert_d, vert_d);

  //       gl.uniform2fv(attrs.uniforms.translate, translate);
  //       gl.uniform2fv(attrs.uniforms.scale, scale);
  //     } else {
  //       gl.uniform1f(attrs.uniforms.quad, 0);
  //     }

  //     for (var j = 0; j < tris.length; j++) {
  //       // If we're rendering an effect to a frame buffer,
  //       // use the same points for the input and output
  //       let pnts = tris[j].input;
  //       let oPnts = tris[j].input;
  //       // If we're rendering the final output use the output points
  //       if (flip === 1) {
  //         if (shapes[i].type === "quad") {
  //           pnts = tris[j].output;
  //         }

  //         oPnts = tris[j].output;
  //       }

  //       let opacity = shapes[i].opacity[idx];

  //       gl.bindBuffer(gl.ARRAY_BUFFER, attrs.buffers.position);
  //       gl.bufferData(
  //         gl.ARRAY_BUFFER,
  //         new Float32Array([
  //           oPnts[0][0] * 2 - 1,
  //           oPnts[0][1] * -2 + 1,
  //           oPnts[1][0] * 2 - 1,
  //           oPnts[1][1] * -2 + 1,
  //           oPnts[2][0] * 2 - 1,
  //           oPnts[2][1] * -2 + 1,
  //         ]),
  //         gl.DYNAMIC_DRAW,
  //       );

  //       gl.vertexAttribPointer(
  //         attrs.locations.position,
  //         2,
  //         gl.FLOAT,
  //         false,
  //         0,
  //         0,
  //       );

  //       gl.bindBuffer(gl.ARRAY_BUFFER, attrs.buffers.texture);
  //       gl.bufferData(
  //         gl.ARRAY_BUFFER,
  //         new Float32Array([
  //           pnts[0][0],
  //           pnts[0][1],
  //           pnts[1][0],
  //           pnts[1][1],
  //           pnts[2][0],
  //           pnts[2][1],
  //         ]),
  //         gl.DYNAMIC_DRAW,
  //       );

  //       gl.vertexAttribPointer(
  //         attrs.locations.texture,
  //         2,
  //         gl.FLOAT,
  //         false,
  //         0,
  //         0,
  //       );
  //       gl.uniform1f(attrs.uniforms.opacity, opacity);
  //       gl.uniform1i(attrs.uniforms.sampler, 0);
  //       gl.drawArrays(gl.TRIANGLES, 0, 3);
  //     }
  //   }
  // }

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

  createProgram(id, gl, vShaderSrc, fShaderSrc) {
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
        id: id,
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

          quad: gl.getUniformLocation(program, "u_quad"),
          translate: gl.getUniformLocation(program, "u_translate"),
          scale: gl.getUniformLocation(program, "u_scale"),
          vert_a: gl.getUniformLocation(program, "u_vertex_a"),
          vert_b: gl.getUniformLocation(program, "u_vertex_b"),
          vert_c: gl.getUniformLocation(program, "u_vertex_c"),
          vert_d: gl.getUniformLocation(program, "u_vertex_d"),
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
      "__main__",
      this.gl,
      vertexShaderSrc,
      fragmentShader,
    );

    this.textures = new Array(6).fill(null).map((t) => {
      return this.initTexture(this.gl);
    });

    if (this.attrs.main !== null) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

      // let effects = this.state.effects;
      for (var i = 0; i < Effects.length; i++) {
        let effect = Effects[i];
        this.attrs.effects.push(
          this.createProgram(
            effect.id,
            this.gl,
            vertexShaderSrc,
            effect.shader,
          ),
        );
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

  async setMedia(videoIdx, deviceId) {
    let videos = document.querySelectorAll(".videos video");
    let vid = videos[videoIdx];

    let media = await navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        return [...devices].filter((d) => {
          return d.kind === "videoinput";
        });
      });

    let device = [...media].find((m) => {
      return m.deviceId === deviceId;
    });

    try {
      let stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: {
            exact: device.deviceId,
          },
        },
      });

      console.log(deviceId);

      vid.srcObject = stream;
      this.videos[videoIdx] = vid;
    } catch (err) {
      console.log("Failed to load webcam:", err);
    }
  }

  removeVideo(idx) {
    let video = this.videos[idx];

    this.textures[idx] = null;
    this.textures[idx] = this.initTexture(this.gl);

    if (!!video) {
      video.pause();
      video.removeAttribute("src");
      video.removeAttribute("srcObject");
      video.load();

      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.videos[idx] = null;
    }
  }

  setEffect(idx, effect) {
    // let fx = Effects.find((e) => e.id === effect);
    // for (var i = 0; i < this.glAttrs.length; i++) {
    //   if (this.attrs === null) {
    //     continue;
    //   }
    //   let attrs = this.attrs;
    //   let gl = this.gl;
    //   if (!!attrs.effects[idx]) {
    //     attrs.effects[idx] = null;
    //   }
    //   if (!!effect && !!fx.shader) {
    //     attrs.effects[idx] = this.createProgram(gl, vertexShaderSrc, fx.shader);
    //   } else {
    //     attrs.effects[idx] = null;
    //   }
    // }
  }

  updateScript(scriptId) {
    // let scripts = JSON.parse(localStorage.getItem("scripts")) || [];
    // let script = scripts.find((s) => s.id === scriptId);
    // this.scripts[scriptId] = new Function(
    //   "state",
    //   "effect_x",
    //   "effect_y",
    //   "script_id",
    //   "registry",
    //   ScriptTemplate(script.code),
    // );
  }

  removeScript(scriptId) {
    // delete this.scripts[scriptId];
  }

  updateSlots(state) {
    let { effects, scripts } = state;

    this.scripts = scripts.map((script) => {
      let raw_code = script.slot.script.code;
      let code = raw_code.replace(/\&gt\;/g, ">").replace(/\&lt\;/g, "<");

      return new Function(
        "state",
        "effect_x",
        "effect_y",
        "script_id",
        "registry",
        ScriptTemplate(code),
      );
    });

    this.effects = effects.map((effect) => {
      return this.attrs.effects.find((e) => {
        return e.id === effect.id;
      });
    });

    for (var i = 0; i < state.slots.length; i++) {
      if (state.slots[i].effect !== "__script") {
        delete this.registry[i];
      }
    }
  }

  setClock(clock, bpm) {
    if (clock === "default") {
      this.clock = setTimeout(
        () => {
          this.handleBeat({ data: [248] });
        },
        (60 / bpm) * 1000,
      );

      return;
    }

    if (!!navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(
        (midiAccess) => {
          for (const entry of midiAccess.inputs) {
            if (entry[1].name === clock) {
              this.clock = entry[1];

              entry[1].onmidimessage = this.handleBeat.bind(this);
            }
          }
        },
        (msg) => {
          console.error(`Failed to get MIDI access - ${msg}`);
        },
      );
    } else {
      console.log("No Midi Access");
    }
  }

  handleBeat(e) {
    if (e.data[0] === 248) {
      this.pulseCount = (this.pulseCount + 1) % 6;

      ////////// Tracking the count //////////
      if (this.pulseCount === 0) {
        if (this.resetBeat) {
          this.beat = [1, 1];
          this.timing = [Date.now(), Date.now()];
          this.resetBeat = false;
        } else {
          let next4th = this.beat[0];
          let next16th = (this.beat[1] + 1) % 5 || 1;
          this.timing[1] = Date.now();

          if (next16th === 1) {
            next4th = (next4th + 1) % 5 || 1;
            this.timing[0] = Date.now();
          }

          this.beat = [next4th, next16th];
          this.beatTick = true;
        }
      }
      ////////// End Tracking counting //////////

      ////////// Tracking the BPM //////////
      if (this.beatStart === null) {
        this.beatStart = Date.now();
      }

      if (this.pulseCount === 0) {
        let diff = Date.now() - this.beatStart;
        let bpm = 60 / (diff / 250);

        this.bpm = bpm;
        this.beatStart = Date.now();
      }
      ////////// End BPM tracking //////////
    }
  }

  setOne() {
    let duration = 125 * (this.bpm / 60);

    if (Date.now() - this.timing[1] < duration) {
      this.beat = [1, 1];
    } else {
      this.resetBeat = true;
    }
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

      if (e.keyCode === 49) {
        this.output.setOne.call(this.output);
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
          } else if (data.action === "set_media") {
            let { videoIdx, deviceId, deviceName } = data;
            let { removeVideo, setMedia } = this.output;

            removeVideo.call(this.output, videoIdx);
            setMedia.call(this.output, videoIdx, deviceId, deviceName);
          } else if (data.action === "update_slot") {
            console.log("Updating Slots");
            let { state } = data;
            let { updateSlots } = this.output;

            updateSlots.call(this.output, state);
            this.setState(state);
          } else if (data.action === "set_clock") {
            let { name, bpm } = data;
            let { setClock } = this.output;

            setClock.call(this.output, name, bpm);
          }
          // } else if (data.action === "set_effect") {
          //   console.log("Setting Effects");
          //   let { effectIdx, effect, state } = data;

          //   this.output.setEffect.call(this.output, effectIdx, effect);
          //   this.setState(state);

          //   this.output.setEffectOrder.call(this.output);
          // } else if (data.action === "set_script") {
          //   console.log("Setting Scripts");
          //   let { scriptIdx, scriptId, state } = data;

          //   this.output.setScript.call(this.output, scriptIdx, scriptId);
          //   this.setState(state);
          // } else if (data.action === "update_script") {
          //   console.log("Updating Script");
          //   let { script_id } = data;

          //   this.output.updateScript.call(this.output, script_id);
          // } else if (data.action === "remove_script") {
          //   let { script_id } = data;

          //   this.output.removeScript.call(this.output, script_id);
          // }
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
