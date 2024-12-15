import { Effects } from "./effects";

// Matrix math from https://github.com/chrvadala/transformation-matrix/blob/main/src/fromTriangles.js
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

// const pixelateShader = `
//   precision mediump float;
//   varying vec2 v_texcoord;
//   uniform sampler2D u_texture;

//   uniform vec2 u_dimensions;
//   uniform mediump float u_opacity;
//   uniform vec2 u_effect;

//   void main() {
//     float pixelateX = u_dimensions[0] * floor(max(u_effect[0] * 30.0, 1.0));
//     float pixelateY = u_dimensions[1] * floor(max(u_effect[1] * 30.0, 1.0));
//     vec2 pixel_coords = vec2(
//       v_texcoord[0] - (v_texcoord[0] - floor(v_texcoord[0]/pixelateX) * pixelateX),
//       v_texcoord[1] - (v_texcoord[1] - floor(v_texcoord[1]/pixelateY) * pixelateY)
//     );

//     gl_FragColor = texture2D(u_texture, pixel_coords);
//   }
// `;

// const prismShader = `
//   precision mediump float;
//   varying vec2 v_texcoord;
//   uniform sampler2D u_texture;

//   uniform vec2 u_dimensions;
//   uniform mediump float u_opacity;
//   uniform vec2 u_effect;

//   void main() {
//     vec2 prism_values = vec2(floor(u_effect[0] * 9.0) + 1.0, floor(u_effect[1] * 9.0) + 1.0);
//     vec2 prism_coords = vec2(fract(v_texcoord[0] * prism_values[0]), fract(v_texcoord[1] * prism_values[1]));

//     gl_FragColor = texture2D(u_texture, prism_coords);
//   }
// `;

// const cosinePaletteShader = `
//   precision mediump float;
//   varying vec2 v_texcoord;
//   uniform sampler2D u_texture;

//   uniform vec2 u_dimensions;
//   uniform mediump float u_opacity;
//   uniform vec2 u_effect;

//   ${shaderMethods["pal"]}
//   ${shaderMethods["rgb2hsv"]}

//   void main() {
//     vec4 color = texture2D(u_texture, v_texcoord);
//     vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));
//     vec3 effect = pal(hsv[2] + u_effect[1], vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
//     vec3 weighted = vec3(
//       color[0] * (1.0 - u_effect[0]) + effect[0] * u_effect[0],
//       color[1] * (1.0 - u_effect[0]) + effect[1] * u_effect[0],
//       color[2] * (1.0 - u_effect[0]) + effect[2] * u_effect[0]
//     );

//     gl_FragColor = vec4(weighted, color[3]);
//   }
// `;

// const colorOpacityShader = `
//   precision mediump float;
//   varying vec2 v_texcoord;
//   uniform sampler2D u_texture;

//   float PI = 3.14159265358;

//   uniform vec2 u_dimensions;
//   uniform mediump float u_opacity;
//   uniform vec2 u_effect;

//   ${shaderMethods["pal"]}
//   ${shaderMethods["rgb2hsv"]}

//   void main() {
//     vec4 color = texture2D(u_texture, v_texcoord);
//     vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));

//     float hue_target = u_effect[0];
//     float hue_dist = 1.0 - (min(abs(hsv[0] - hue_target), 1.0 - abs(hsv[0] - hue_target)) / 0.5);
//     float hue_opacity =  sin(pow(hue_dist, 2.0) * (PI / 2.0));

//     gl_FragColor = vec4(color[0], color[1], color[2], hue_opacity * u_effect[1]);
//   }
// `;

// const _fragmentShaderSrc = `
//   precision mediump float;

//   float PI = 3.14159265358;

//   // Passed in from the vertex shader
//   varying vec2 v_texcoord;

//   // The texture.
//   uniform sampler2D u_texture;

//   // 128 pixel buffer to hold a running palette
//   uniform sampler2D u_palette;
//   uniform sampler2D u_palette_buffer;

//   // Prism Effect
//   uniform vec2 u_prism;

//   // Color Values
//   uniform vec2 u_color_values;

//   // Cosine Palette
//   uniform vec2 u_cosine_palette;

//   // Color Opacity
//   uniform vec2 u_color_opacity;

//   // Pixelate
//   uniform vec2 u_pixelate;

//   // Opacity
//   uniform mediump float u_opacity;

//   // Texture Dimensions
//   uniform vec2 u_dimensions;

//   // Old Opacity
//   uniform vec3 u_effects;

//   vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
//   {
//     return a + b*cos( 6.28318*(c*t+d) );
//   }

//   vec3 rgb2hsv(vec3 c)
//   {
//     vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
//     vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
//     vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

//     float d = q.x - min(q.w, q.y);
//     float e = 1.0e-10;
//     return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
//   }

//   void main() {
//     //////////////// Coordinate Effects /////////////////

//     // Pixellate
//     float pixelateX = u_dimensions[0] * floor(max(u_pixelate[0] * 30.0, 1.0));
//     float pixelateY = u_dimensions[1] * floor(max(u_pixelate[0] * 30.0, 1.0));
//     vec2 pixellated = vec2(
//       v_texcoord[0] - (v_texcoord[0] - floor(v_texcoord[0]/pixelateX) * pixelateX),
//       v_texcoord[1] - (v_texcoord[1] - floor(v_texcoord[1]/pixelateY) * pixelateY)
//     );

//     // Prism Effect
//     vec2 prism_values = vec2(floor(u_prism[0] * 9.0) + 1.0, floor(u_prism[1] * 9.0) + 1.0);
//     vec2 prism_coords = vec2(fract(pixellated[0] * prism_values[0]), fract(pixellated[1] * prism_values[1]));

//     ///////////////// Color Effects ////////////////////////

//     // Get the texture color
//     vec4 color = texture2D(u_texture, prism_coords);

//     // Cosine Palette
//     vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));
//     vec3 effect = pal(hsv[2] + u_cosine_palette[1], vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
//     vec3 weighted = vec3(
//       color[0] * (1.0 - u_cosine_palette[0]) + effect[0] * u_cosine_palette[0],
//       color[1] * (1.0 - u_cosine_palette[0]) + effect[1] * u_cosine_palette[0],
//       color[2] * (1.0 - u_cosine_palette[0]) + effect[2] * u_cosine_palette[0]
//     );

//     // RGB Opacity
//     float hue_target = u_color_opacity[0];
//     float hue_dist = 1.0 - (min(abs(hsv[0] - hue_target), 1.0 - abs(hsv[0] - hue_target)) / 0.5);
//     float hue_opacity =  sin(pow(hue_dist, 2.0) * (PI / 2.0));

//     gl_FragColor =  vec4(weighted, max(0.0, u_opacity - (hue_opacity * u_color_opacity[1])));
//   }
// `;

// const shaders = {
//   default: null,
//   cosine_palette: cosinePaletteShader,
//   color_opacity: colorOpacityShader,
//   cosine_distort: null,
//   prism: prismShader,
//   pixelate: pixelateShader,
// };

class UI {
  constructor(state) {
    this.state = state;

    this.pointSize = 10;
    this.layer = "output";
    this.layerColor = {
      input: [255, 0, 0],
      output: [0, 0, 255],
    };

    this.selectedPoint = null;

    this.elements = {
      fps: document.querySelector("#fps"),
      ctx: document.querySelector("#ui").getContext("2d"),
    };

    this.opacity = {
      value: 0,
      timer: null,
    };
  }

  updateState(state) {
    this.state = state;
  }

  setLayer(layer) {
    this.layer = layer;
  }

  setSelectedPoint(point) {
    this.selectedPoint = point;
  }

  drawUI() {
    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;

    ctx.clearRect(0, 0, width, height);

    this.drawPoints();
    this.tracePoints();
  }

  tracePoints() {
    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;
    let { shapes } = this.state;

    let clr = this.layerColor[this.layer];

    for (var i = 0; i < shapes.length; i++) {
      ctx.strokeStyle = `rgba(${clr[0]},${clr[1]},${clr[2]},${this.opacity.value})`;

      let shape = shapes[i].points[this.layer];
      let originX = (width * shape[0][0]) | 0;
      let originY = (height * shape[0][1]) | 0;

      ctx.beginPath();
      ctx.moveTo(originX, originY);
      for (var k = 1; k < 3; k++) {
        let x = (width * shape[k][0]) | 0;
        let y = (height * shape[k][1]) | 0;

        ctx.lineTo(x, y);
      }

      ctx.lineTo(originX, originY);
      ctx.stroke();
      ctx.closePath();
    }
  }

  drawPoints() {
    this.loopPoints(this.drawPoint.bind(this));
  }

  drawPoint(x, y) {
    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;

    let clr = this.layerColor[this.layer];
    let opacity = this.opacity.value;

    let offset = this.pointSize >> 1;
    let minX = Math.min(Math.max(x - offset, 0), width - this.pointSize);
    let minY = Math.min(Math.max(y - offset, 0), height - this.pointSize);

    ctx.fillStyle = `rgba(${clr[0]},${clr[1]},${clr[2]},${opacity})`;
    ctx.fillRect(minX, minY, this.pointSize, this.pointSize);

    return true;
  }

  checkPoints(e) {
    this.loopPoints(this.checkPoint.bind(this, e));
  }

  checkPoint(e, x, y, objIdx, pntIdx) {
    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;

    let offset = this.pointSize >> 1;
    let mouseX = ctx.canvas.width * (e.pageX / window.innerWidth);
    let mouseY = ctx.canvas.height * (e.pageY / window.innerHeight);

    let minX = Math.min(Math.max(x - offset, 0), width - this.pointSize);
    let minY = Math.min(Math.max(y - offset, 0), height - this.pointSize);
    let maxX = Math.max(Math.min(x + offset, width), this.pointSize);
    let maxY = Math.max(Math.min(y + offset, height), this.pointSize);

    if (mouseX <= maxX && mouseX >= minX && mouseY <= maxY && mouseY >= minY) {
      this.selectedPoint = [objIdx, pntIdx];
      return false;
    }

    return true;
  }

  movePoint(e) {
    // TODO: THIS is what needs to be calulated per video

    let x = e.pageX / window.innerWidth;
    let y = e.pageY / window.innerHeight;

    let { shapes } = this.state;
    let { selectedPoint, layer } = this;

    let selectedObject = shapes[selectedPoint[0]].points[layer];
    let point = selectedObject[selectedPoint[1]];

    point[0] = x;
    point[1] = y;

    if (!!window.opener) {
      window.opener.postMessage(
        JSON.stringify({
          action: "update_state",
          state: this.state,
        }),
      );
    }

    // localStorage.setItem("zones", JSON.stringify(this.zones));
  }

  loopPoints(fn) {
    let { ctx } = this.elements;
    let { shapes } = this.state;

    for (var i = 0; i < shapes.length; i++) {
      let pnts = shapes[i].points[this.layer];

      let width = ctx.canvas.width;
      let height = ctx.canvas.height;

      for (var j = 0; j < pnts.length; j++) {
        let pnt = pnts[j];

        let x = (width * pnt[0]) | 0;
        let y = (height * pnt[1]) | 0;

        let cont = fn(x, y, i, j);
        if (!cont) {
          return;
        }
      }
    }
  }
}

class Output {
  constructor(state) {
    this.state = state;

    this.videos = new Array(6).fill(null);
    this.contexts = new Array(6).fill(null);
    this.textures = [];
    this.glAttrs = new Array(6).fill(null);
    // this.matrices = [];

    this.gl = null;
    this.attrs = {
      main: null,

      effects: [],
      textures: [],
      buffers: [],
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

    this.state = state;
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
    for (var i = 0; i < this.videos.length; i++) {
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

    // Skip if video isn't playing
    if (videoEl.currentTime === 0) {
      return;
    }

    // Draw the video frame for a frame buffer
    this.updateTexture(gl, attrs, this.textures, videoEl);
    // Loop through the effects and draw each to a framebuffer
    let activeBuffer = 0;
    for (var i = 0; i < effects.length; i++) {
      if (!effects[i]) {
        continue;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, attrs.buffers[activeBuffer % 2]);
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

      gl.bindTexture(gl.TEXTURE_2D, attrs.textures[activeBuffer % 2]);
      activeBuffer++;
    }

    // Draw to the screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, videoEl.videoWidth, videoEl.videoHeight);
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

    for (var j = 0; j < shapes.length; j++) {
      // If we're rendering an effect to a frame buffer,
      // use the same points for the input and output
      let pnts = shapes[j].points.input;
      let oPnts = shapes[j].points.input;
      // If we're rendering the final output use the output points
      if (flip === 1) {
        oPnts = shapes[j].points.output;
      }

      let opacity = shapes[j].opacity[idx];

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

      gl.vertexAttribPointer(attrs.locations.texture, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(attrs.uniforms.opacity, opacity);
      gl.uniform1i(attrs.uniforms.sampler, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
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

  // createVideo(idx, video) {
  //   console.log(idx, video);

  //   this.videos[idx] = video;
  //   // this.createContext(idx);
  // }

  createContext(idx) {
    if (this.gl === null) {
      let contextsEl = document.querySelector(".contexts");
      let canvas = document.createElement("canvas");
      this.gl = canvas.getContext("webgl");
    }

    this.attrs.main = this.createProgram(
      this.gl,
      vertexShaderSrc,
      fragmentShader,
    );

    this.textures = this.initTexture(this.gl);

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

    // this.glAttrs[idx] = glAttrs;
    // this.contexts[idx] = gl;
  }

  updateContext(video) {
    // let idx = this.videos.indexOf(video);
    // if (idx === -1) {
    //   console.log("Couldn't find video:", video);
    //   return;
    // }

    // gl.canvas.width = video.videoWidth;
    // gl.canvas.height = video.videoHeight;
    this.gl.viewport(0, 0, video.videoWidth, video.videoHeight);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  initTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because video has to be download over the internet
    // they might take a moment until it's ready so
    // put a single pixel in the texture so we can
    // use it immediately.
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

    return texture;
  }

  updateTexture(gl, attrs, texture, video) {
    if (video.currentTime === 0) {
      return;
    }

    console.log("Updating Texture", texture, video);

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    // On the first update, create the frame buffers
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

    gl.bindTexture(gl.TEXTURE_2D, texture);
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

  // createMatrix(video) {
  //   let idx = this.videos.indexOf(video);
  //   if (idx === -1) {
  //     console.log("Couldn't find video:", video);
  //   }

  //   while (this.matrices.length <= idx) {
  //     this.matrices.push([]);
  //   }
  // }

  // calculateMatrices() {
  //   for (var v = 0; v < this.videos.length; v++) {
  //     if (this.matrices[v] === void 0) {
  //       this.matrices.push([]);
  //     }

  //     this.calculateMatrix(this.videos[v]);
  //   }
  // }

  // calculateMatrix(video) {
  //   let { shapes } = this.state;

  //   let idx = this.videos.indexOf(video);
  //   if (idx === -1) {
  //     console.log("Couldn't find video:", video);
  //   }

  //   let widthI = video.videoWidth;
  //   let heightI = video.videoHeight;

  //   // let widthO = this.contexts[idx].canvas.width;
  //   // let heightO = this.contexts[idx].canvas.height;

  //   let widthO = video.videoWidth;
  //   let heightO = video.videoHeight;

  //   let matrices = this.matrices[idx];
  //   for (var i = 0; i < shapes.length; i++) {
  //     if (matrices[i] === void 0) {
  //       matrices.push(null);
  //     }

  //     let shape = shapes[i];
  //     let { input, output } = shape.points;

  //     let transformedI = input.map((pnt) => {
  //       return [(pnt[0] * widthI) | 0, (pnt[1] * heightI) | 0];
  //     });

  //     let transformedO = output.map((pnt) => {
  //       return [(pnt[0] * widthO) | 0, (pnt[1] * heightO) | 0];
  //     });

  //     matrices[i] = this.matrixFromTriangles(transformedI, transformedO);
  //   }
  // }

  // inverse(matrix) {
  //   const { a, b, c, d, e, f } = matrix;
  //   const denom = a * d - b * c;

  //   return {
  //     a: d / denom,
  //     b: b / -denom,
  //     c: c / -denom,
  //     d: a / denom,
  //     e: (d * e - c * f) / -denom,
  //     f: (b * e - a * f) / denom,
  //   };
  // }

  // transform(...matrices) {
  //   matrices = Array.isArray(matrices[0]) ? matrices[0] : matrices;

  //   const multiply = (m1, m2) => {
  //     return {
  //       a: m1.a * m2.a + m1.c * m2.b,
  //       c: m1.a * m2.c + m1.c * m2.d,
  //       e: m1.a * m2.e + m1.c * m2.f + m1.e,
  //       b: m1.b * m2.a + m1.d * m2.b,
  //       d: m1.b * m2.c + m1.d * m2.d,
  //       f: m1.b * m2.e + m1.d * m2.f + m1.f,
  //     };
  //   };

  //   switch (matrices.length) {
  //     case 0:
  //       throw new Error("no matrices provided");

  //     case 1:
  //       return matrices[0];

  //     case 2:
  //       return multiply(matrices[0], matrices[1]);

  //     default: {
  //       const [m1, m2, ...rest] = matrices;
  //       const m = multiply(m1, m2);
  //       return transform(m, ...rest);
  //     }
  //   }
  // }

  // smoothMatrix(matrix, precision = 10000000000) {
  //   return {
  //     a: Math.round(matrix.a * precision) / precision,
  //     b: Math.round(matrix.b * precision) / precision,
  //     c: Math.round(matrix.c * precision) / precision,
  //     d: Math.round(matrix.d * precision) / precision,
  //     e: Math.round(matrix.e * precision) / precision,
  //     f: Math.round(matrix.f * precision) / precision,
  //   };
  // }

  // matrixFromTriangles(t1, t2) {
  //   const px1 = t1[0][0];
  //   const py1 = t1[0][1];
  //   const px2 = t2[0][0];
  //   const py2 = t2[0][1];

  //   // point q = second point of the triangle
  //   const qx1 = t1[1][0];
  //   const qy1 = t1[1][1];
  //   const qx2 = t2[1][0];
  //   const qy2 = t2[1][1];

  //   // point r = third point of the triangle
  //   const rx1 = t1[2][0];
  //   const ry1 = t1[2][1];
  //   const rx2 = t2[2][0];
  //   const ry2 = t2[2][1];

  //   const r1 = {
  //     a: px1 - rx1,
  //     b: py1 - ry1,
  //     c: qx1 - rx1,
  //     d: qy1 - ry1,
  //     e: rx1,
  //     f: ry1,
  //   };
  //   const r2 = {
  //     a: px2 - rx2,
  //     b: py2 - ry2,
  //     c: qx2 - rx2,
  //     d: qy2 - ry2,
  //     e: rx2,
  //     f: ry2,
  //   };

  //   const inverseR1 = this.inverse(r1);
  //   const affineMatrix = this.transform([r2, inverseR1]);

  //   // round the matrix elements to smooth the finite inversion
  //   return this.smoothMatrix(affineMatrix);
  // }

  // applyToPoint(matrix, point) {
  //   return [
  //     matrix.a * point[0] + matrix.c * point[1] + matrix.e,
  //     matrix.b * point[0] + matrix.d * point[1] + matrix.f,
  //   ];
  // }

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

    // vid.playsInline = true;
    // vid.loop = true;
    // vid.muted = true;
    // vid.addEventListener("loadedmetadata", (e) => {
    //   setTimeout(() => {
    //     // this.calculateMatrix(e.target);
    //     this.updateContext(e.target);

    //     vid.play();
    //   }, 100);
    // });

    vid.src = URL.createObjectURL(file);

    this.videos[idx] = vid;
    // this.createVideo(idx, vid);
    // this.createMatrix(vid);
    this.reset_video = null;
  }

  removeVideo(idx) {
    let video = this.videos[idx];
    // let gl = this.contexts[idx];

    if (!!video) {
      video.pause();
      video.removeAttribute("src");
      video.load();

      gl.clear(gl.COLOR_BUFFER_BIT);

      this.videos[idx] = null;
      // this.contexts[idx] = null;
      // this.glAttrs[idx] = null;

      // gl.canvas.parentNode.removeChild(gl.canvas);
      // video.parentNode.removeChild(video);
    }
  }

  setEffect(idx, effect) {
    let fx = Effects.find((e) => e.id === effect);

    // console.log(effect);
    // console.log(Effects);

    for (var i = 0; i < this.glAttrs.length; i++) {
      if (this.attrs === null) {
        continue;
      }

      let attrs = this.attrs;
      let gl = this.gl;

      if (!!attrs.effects[idx]) {
        // TODO: if there starts to be weird things, then this
        // is not enough to clean up old programs, but it
        // should be
        attrs.effects[idx] = null;
      }

      // console.log(fx);

      if (!!effect && !!fx.shader) {
        attrs.effects[idx] = this.createProgram(gl, vertexShaderSrc, fx.shader);
      } else {
        attrs.effects[idx] = null;
      }
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

      // if (oldState.shapes.length !== this.state.shapes.length) {
      //   this.output.calculateMatrices.call(this.output);
      // }
    }
  }

  setupListeners() {
    window.addEventListener("mousedown", (e) => {
      if (!this.ui) {
        return;
      }

      let { checkPoints } = this.ui;
      let { videos, pause } = this.output;

      videos.map((video) => {
        if (video !== null) {
          video.pause();
        }
      });

      // pause.call(this.output);
      checkPoints.call(this.ui, e);
    });

    window.addEventListener("mouseup", () => {
      if (!this.ui) {
        return;
      }

      let { videos, play } = this.output;
      let { setSelectedPoint } = this.ui;

      videos.map((video, idx) => {
        if (video !== null) {
          video.play();
        }
      });

      // play.call(this.output);
      setSelectedPoint.call(this.ui, null);
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.ui) {
        return;
      }

      let { selectedPoint, movePoint } = this.ui;
      let { videos, drawFrame /*, calculateMatrices*/ } = this.output;

      if (selectedPoint !== null) {
        movePoint.call(this.ui, e);
        // calculateMatrices.call(this.output);
      }
    });

    window.addEventListener("mousemove", () => {
      if (!this.ui) {
        return;
      }

      let { opacity, drawUI } = this.ui;

      opacity.value = 1;
      if (opacity.timer !== null) {
        clearTimeout(opacity.timer);
      }

      let opacityFn = () => {
        opacity.value -= 0.02;

        if (opacity.value > 0) {
          opacity.timer = setTimeout(opacityFn, 30);
        } else {
          opacity.value = 0;
          opacity.timer = null;
        }

        drawUI.call(this.ui);
      };

      opacity.timer = setTimeout(opacityFn, 5000);
      drawUI.call(this.ui);
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
        }
      } else {
        let { loadVideo } = this.output;

        loadVideo.call(this.output, event.data);
      }

      // localStorage.setItem("zones", JSON.stringify(this.zones));
    });
  }
}

window.app = null;
window.addEventListener("load", () => {
  window.app = new App();
});
