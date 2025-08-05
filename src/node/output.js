import { Effects } from "../js/lib/Effects.js";
import { UI } from "../js/lib/ScreenUI.js";
import { ScriptTemplate } from "../js/lib/ScriptTemplate.js";

import { Player } from "./player.js";

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
  #ifdef GL_ES
    precision mediump float;
  #endif
  
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
  #ifdef GL_ES
    precision mediump float;
  #endif
  
  varying vec2 v_texcoord;

  uniform sampler2D u_texture;
  uniform sampler2D u_texture_y;
  uniform sampler2D u_texture_u;
  uniform sampler2D u_texture_v;

  uniform vec2 u_dimensions;
  uniform float u_opacity;
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

const yuvFragmentShader = `
  #ifdef GL_ES
    precision mediump float;
  #endif
  
  varying vec2 v_texcoord;

  uniform sampler2D u_texture;
  uniform sampler2D u_texture_y;
  uniform sampler2D u_texture_u;
  uniform sampler2D u_texture_v;

  uniform vec2 u_dimensions;
  uniform float u_opacity;
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
    float r, g, b, y, u, v;
    
    if (u_quad == 1.0) {
      vec2 lerped = invBilinear(v_texcoord, u_vertex_a, u_vertex_b, u_vertex_c, u_vertex_d);
      vec2 scaled = vec2(lerped[0] * u_scale[0], lerped[1] * u_scale[1]);
      vec2 translated = vec2(scaled[0] + u_translate[0], scaled[1] + u_translate[1]);

      coords = translated;
    } else {
      coords = v_texcoord;
    }

    
    // vec4 color = texture2D(u_texture, coords);
    
    y = texture2D(u_texture_y, coords).r;
    u = texture2D(u_texture_u, coords).r;
    v = texture2D(u_texture_v, coords).r;

    y = 1.1643*(y-0.0625);
    u = u-0.5;
    v = v-0.5;

    r = y+1.5958*v;
    g = y-0.39173*u-0.81290*v;
    b = y+2.017*u;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

export class Output {
  constructor(gl, state) {
    this.pending_state = state;
    this.state = state;
    this.epoch = Date.now();

    this.videos = new Array(6).fill(null);
    this.contexts = new Array(6).fill(null);
    this.textures = [];
    this.frames = new Array(6).fill(null);
    this.glAttrs = new Array(6).fill(null);

    this.scripts = {};
    // TODO: read from drive
    // this.scripts = (JSON.parse(localStorage.getItem("scripts")) || []).reduce(
    //   (a, c) => {
    //     a[c.id] = new Function(
    //       "state",
    //       "effect_x",
    //       "effect_y",
    //       ScriptTemplate(c.code),
    //     );

    //     return a;
    //   },
    //   {},
    // );

    this.gl = gl;
    this.attrs = {
      main: null,
      yuv: null,
      effects: [],
    };

    this.isPlaying = false;
    this.reset_video = null;

    // document.querySelectorAll(".videos video").forEach((vid) => {
    //   vid.addEventListener("loadedmetadata", (e) => {
    //     setTimeout(() => {
    //       this.updateContext(e.target);
    //       vid.play();
    //     }, 100);
    //   });
    // });

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
      let next = state;

      for (var j = 0; j < state.effects.length; j++) {
        let effect = Effects.find((e) => e.id === state.effects[j]);
        if (!!effect && effect.id === "video_controls") {
          let prev = state.values.effects[i][j];
          let curr = next.values.effects[i][j];

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
    let state = JSON.parse(JSON.stringify(this.state));

    // state.elapsed = Date.now() - this.epoch;
    // for (let i = 0; i < 6; i++) {
    //   let script_id = state.scripts[i];
    //   if (script_id !== null) {
    //     let script = this.scripts[script_id];
    //     let values = state.values.scripts[i];
    //     script(state, values[0], values[1]);
    //   }
    // }

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    for (let i = len; i >= 0; i--) {
      if (this.videos[i] !== null) {
        this.drawFrame(i, state);
      }
    }

    // window.requestAnimationFrame(this.step.bind(this));
  }

  drawFrame(idx, state) {
    let { shapes, values } = state;

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
    let video = this.videos[idx];
    let vals = values.effects[idx];
    let texture = this.textures[idx];

    // Skip if video isn't playing
    if (!video.width) {
      return;
    }

    // Clear the frame buffers
    for (let i = 0; i < 2; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, texture.attrs.buffers[i]);
      gl.viewport(0, 0, video.width, video.height);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Draw the video frame for a frame buffer
    this.updateTexture(gl, texture, idx);

    // Convert the YUV frame to an RGBA frame
    gl.bindFramebuffer(gl.FRAMEBUFFER, texture.attrs.buffers[0]);
    gl.viewport(0, 0, video.width, video.height);
    this.drawYUVShapes(gl, video, idx, attrs.yuv, shapes, [0, 0], -1, texture);
    gl.bindTexture(gl.TEXTURE_2D, texture.attrs.textures[0]);

    let activeBuffer = 1;
    for (let i = 0; i < effects.length; i++) {
      if (!effects[i]) {
        continue;
      }

      activeBuffer = (activeBuffer + 1) % 2;

      gl.bindFramebuffer(gl.FRAMEBUFFER, texture.attrs.buffers[activeBuffer]);
      gl.viewport(0, 0, video.width, video.height);

      this.drawShapes(
        gl,
        video,
        idx,
        effects[i],
        shapes,
        vals[i],
        -1,
        activeBuffer,
      );

      gl.bindTexture(gl.TEXTURE_2D, texture.attrs.textures[activeBuffer]);
    }

    // Draw to the screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, video.width * 2, video.height * 2);
    // gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);
    this.drawShapes(
      gl,
      video,
      idx,
      attrs.main,
      shapes,
      [0, 0],
      1,
      (activeBuffer + 1) % 2,
    );
  }

  drawShapes(gl, video, idx, attrs, shapes, values, flip, bufferIdx) {
    gl.useProgram(attrs.program);
    gl.uniform2fv(attrs.uniforms.effect, values);
    gl.uniform1f(attrs.uniforms.flip, flip);
    gl.uniform2fv(attrs.uniforms.dimensions, [
      1 / video.width,
      1 / video.height,
    ]);

    for (var i = 0; i < shapes.length; i++) {
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

        let opacity = shapes[i].opacity[idx];

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
        gl.uniform1i(attrs.uniforms.sampler, 2 + bufferIdx);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }
  }

  drawYUVShapes(gl, video, idx, attrs, shapes, values, flip, texture) {
    gl.useProgram(attrs.program);
    gl.uniform2fv(attrs.uniforms.effect, values);
    gl.uniform1f(attrs.uniforms.flip, flip);
    gl.uniform2fv(attrs.uniforms.dimensions, [
      1 / video.width,
      1 / video.height,
    ]);

    for (var i = 0; i < shapes.length; i++) {
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

        let opacity = shapes[i].opacity[idx];

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
        gl.uniform1i(attrs.uniforms.sampler_y, 0);
        gl.uniform1i(attrs.uniforms.sampler_u, 1);
        gl.uniform1i(attrs.uniforms.sampler_v, 2);

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
    } else {
      console.warn(`Failed to build shaders`, success, source);
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
          sampler_y: gl.getUniformLocation(program, "u_texture_y"),
          sampler_u: gl.getUniformLocation(program, "u_texture_u"),
          sampler_v: gl.getUniformLocation(program, "u_texture_v"),

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
      console.warn("Error creating program");
      gl.deleteProgram(program);
      return null;
    }
  }

  createContext() {
    this.attrs.main = this.createProgram(
      this.gl,
      vertexShaderSrc,
      fragmentShader,
    );

    this.attrs.yuv = this.createProgram(
      this.gl,
      vertexShaderSrc,
      yuvFragmentShader,
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
    this.gl.viewport(0, 0, 1280 * 2, 720 * 2);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  initTexture(gl) {
    // const texture = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue

    let createYUVTexure = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        gl.RGBA,
        width,
        height,
        border,
        gl.LUMINANCE,
        srcType,
        pixel,
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      return tex;
    };

    return {
      yuv: {
        y: createYUVTexure(),
        u: createYUVTexure(),
        v: createYUVTexure(),
      },
      attrs: {
        textures: [],
        buffers: [],
      },
    };
  }

  updateFrame(idx, y, u, v, i) {
    this.frames[idx] = {
      y: y,
      u: u,
      v: v,
      i: i,
    };
  }

  updateTexture(gl, texture, idx) {
    if (!this.frames[idx]) {
      return;
    }

    const frame = this.frames[idx];

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.LUMINANCE;
    const srcType = gl.UNSIGNED_BYTE;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.yuv.y);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      gl.RGBA,
      gl.LUMINANCE,
      srcType,
      frame.y,
    );

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture.yuv.u);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      gl.RGBA,
      gl.LUMINANCE,
      srcType,
      frame.u,
    );

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture.yuv.v);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      gl.RGBA,
      gl.LUMINANCE,
      srcType,
      frame.v,
    );

    const { attrs } = texture;
    if (attrs.textures.length < 2 && attrs.buffers.length < 2) {
      for (let i = 0; i < 2; i++) {
        const bufferTexture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0 + i + 3);
        gl.bindTexture(gl.TEXTURE_2D, bufferTexture);
        gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, gl.RGBA, srcType, frame.i);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        let frameBuffer = this.initFrameBuffer(gl, bufferTexture);

        attrs.textures.push(bufferTexture);
        attrs.buffers.push(frameBuffer);
      }
    }
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
    // this.removeVideo(idx);
    // this.reset_video = idx;
    this.videos[idx].stop();
  }

  loadVideo(path, idx) {
    // if (this.reset_video === null) {
    //   return;
    // }

    // let idx = this.reset_video;
    // let videos = document.querySelectorAll(".videos video");
    // let vid = videos[idx];

    // vid.src = URL.createObjectURL(file);

    // this.videos[idx] = vid;
    // this.reset_video = null;

    this.videos[idx] = new Player(path, (y, u, v, i) => {
      // console.log("Y", y);
      // console.log("U", u);
      // console.log("V", v);
      // console.log("I", i);
      this.updateFrame(
        idx,
        {
          width: this.videos[idx].width,
          height: this.videos[idx].height,
          data: y,
        },
        {
          width: this.videos[idx].width / 2,
          height: this.videos[idx].height / 2,
          data: u,
        },
        {
          width: this.videos[idx].width / 2,
          height: this.videos[idx].height / 2,
          data: v,
        },
        {
          width: this.videos[idx].width,
          height: this.videos[idx].height,
          data: i,
        },
      );
    });

    this.videos[idx].start();

    // this.reset_video = null;
  }

  removeVideo(idx) {
    // let video = this.videos[idx];
    // let gl = this.contexts[idx];

    this.textures[idx] = null;
    this.textures[idx] = this.initTexture(this.gl);

    if (!!this.videos[idx]) {
      this.videos[idx].stop();
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

  updateScript(scriptId) {
    // let scripts = JSON.parse(localStorage.getItem("scripts")) || [];
    // let script = scripts.find((s) => s.id === scriptId);
    // this.scripts[scriptId] = new Function(
    //   "state",
    //   "effect_x",
    //   "effect_y",
    //   "previous_value",
    //   ScriptTemplate(script.code),
    // );
  }

  removeScript(scriptId) {
    // delete this.scripts[scriptId];
  }
}
