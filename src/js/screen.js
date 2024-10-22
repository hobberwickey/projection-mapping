// Matrix math from https://github.com/chrvadala/transformation-matrix/blob/main/src/fromTriangles.js

const vertexShaderSrc = `
  // attribute vec4 a_position;
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
   
  // uniform mat4 u_matrix;
  uniform mat3 u_matrix;
   
  varying vec2 v_texcoord;
   
  void main() {
    // Multiply the position by the matrix.
    // gl_Position = u_matrix * a_position;
    
    vec3 transformedCoords = u_matrix * vec3(a_position,1.0);
    gl_Position = vec4(transformedCoords.xy, 0.0, 1.0);
    
    // Pass the texcoord to the fragment shader.
    v_texcoord = a_texcoord;
  }
`;

const fragmentShaderSrc = `
  precision mediump float;
 
  // Passed in from the vertex shader.
  varying vec2 v_texcoord;
   
  // The texture.
  uniform sampler2D u_texture;

  // Opacity
  uniform vec3 u_effects;

  vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) 
  {
    return a + b*cos( 6.28318*(c*t+d) );
  }

  vec3 rgb2hsv(vec3 c)
  {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  void main() {
    vec4 color = texture2D(u_texture, v_texcoord);
    vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));
    
    vec3 effect = pal(hsv[2] + u_effects[2], vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
    vec3 weighted = vec3(
      color[0] * (1.0 - u_effects[1]) + effect[0] * u_effects[1],
      color[1] * (1.0 - u_effects[1]) + effect[1] * u_effects[1],
      color[2] * (1.0 - u_effects[1]) + effect[2] * u_effects[1]
    );
    gl_FragColor =  vec4(weighted, u_effects[0]);
  }
`;

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

    // console.log(mouseX, mouseY, minX, minY, maxX, maxY);

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

    if (!!window.parent) {
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

    this.videos = [];
    this.contexts = [];
    this.matrices = [];
    this.textures = [];
    this.glAttrs = [];

    this.isPlaying = false;

    this.reset_video = null;
    // this.stepFn = null;
  }

  updateState(state) {
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
      this.drawFrame(i);
    }

    window.requestAnimationFrame(this.step.bind(this));
  }

  drawFrame(idx) {
    // for (var i = 0; i < this.videos.length; i++) {
    let { videos, shapes } = this.state;

    let gl = this.contexts[idx];
    let glAttrs = this.glAttrs[idx];

    let video = videos[idx];
    let videoEl = this.videos[idx];

    // TODO: When multiple effects are implemented all the
    // appropriate values should be set before the shape loop
    let values = video.values[0];

    // Skip if video isn't playing
    if (videoEl.currentTime === 0) {
      return;
    }

    this.updateTexture(gl, glAttrs.texture, videoEl);

    for (var j = 0; j < shapes.length; j++) {
      let pnts = shapes[j].points.input;
      let opacity = shapes[j].opacity[idx];

      let transformed = pnts.map((pnt) => {
        let absolute = [gl.canvas.width * pnt[0], gl.canvas.height * pnt[1]];
        let transformed = this.applyToPoint(this.matrices[idx][j], absolute);
        let relative = [
          transformed[0] / gl.canvas.width,
          transformed[1] / gl.canvas.height,
        ];

        return relative;
      });

      let positions = [
        transformed[0][0] * 2 - 1,
        transformed[0][1] * -2 + 1,
        transformed[1][0] * 2 - 1,
        transformed[1][1] * -2 + 1,
        transformed[2][0] * 2 - 1,
        transformed[2][1] * -2 + 1,
      ];

      gl.bindBuffer(gl.ARRAY_BUFFER, glAttrs.positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.DYNAMIC_DRAW,
      );

      gl.vertexAttribPointer(
        glAttrs.locations.position,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, glAttrs.textureBuffer);
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
        glAttrs.locations.texture,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      );

      gl.uniform3fv(glAttrs.uniforms.effects, [opacity, values[0], values[1]]);
      gl.uniform1i(glAttrs.uniforms.sampler, 0);

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

  createProgram(gl, vertexShader, fragmentShader) {
    let program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    } else {
      gl.deleteProgram(program);
      return null;
    }
  }

  createVideo(video) {
    this.videos.push(video);
    this.createContext();
  }

  createContext() {
    let contextsEl = document.querySelector(".contexts");
    let canvas = document.createElement("canvas");
    contextsEl.appendChild(canvas);

    let gl = canvas.getContext("webgl");
    let glAttrs = {
      vertexShader: null,
      fragmentShader: null,
      program: null,
      locations: {
        position: null,
        texture: null,
      },

      uniforms: {
        sampler: null,
        matrix: null,
        effects: null,
      },

      positionBuffer: null,
      textureBuffer: null,
      texture: null,
    };

    glAttrs.vertexShader = this.createShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSrc,
    );
    glAttrs.fragmentShader = this.createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSrc,
    );

    glAttrs.program = this.createProgram(
      gl,
      glAttrs.vertexShader,
      glAttrs.fragmentShader,
    );

    if (glAttrs.program !== null) {
      gl.useProgram(glAttrs.program);

      // Setup position buffer
      glAttrs.locations.position = gl.getAttribLocation(
        glAttrs.program,
        "a_position",
      );

      glAttrs.positionBuffer = gl.createBuffer();
      gl.enableVertexAttribArray(glAttrs.locations.position);
      gl.bindBuffer(gl.ARRAY_BUFFER, glAttrs.positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([0, 0, 1, 1, 1, -1]),
        gl.DYNAMIC_DRAW,
      );

      gl.vertexAttribPointer(
        glAttrs.locations.position,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      );

      // Setup texture buffer
      glAttrs.locations.texture = gl.getAttribLocation(
        glAttrs.program,
        "a_texcoord",
      );

      glAttrs.textureBuffer = gl.createBuffer();
      gl.enableVertexAttribArray(glAttrs.locations.texture);
      gl.bindBuffer(gl.ARRAY_BUFFER, glAttrs.textureBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([0.5, 0.5, 1, 0, 1, 1]),
        gl.DYNAMIC_DRAW,
      );

      gl.vertexAttribPointer(
        glAttrs.locations.texture,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      );

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      glAttrs.texture = this.initTexture(gl);

      glAttrs.uniforms.sampler = gl.getUniformLocation(
        glAttrs.program,
        "u_texture",
      );

      glAttrs.uniforms.matrix = gl.getUniformLocation(
        glAttrs.program,
        "u_matrix",
      );
      let matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      gl.uniformMatrix3fv(glAttrs.uniforms.matrix, false, matrix);

      glAttrs.uniforms.effects = gl.getUniformLocation(
        glAttrs.program,
        "u_effects",
      );
      gl.uniform3fv(glAttrs.uniforms.effects, [1, 0, 0]);

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    this.glAttrs.push(glAttrs);
    this.contexts.push(gl);
  }

  updateContext(video) {
    let idx = this.videos.indexOf(video);
    if (idx === -1) {
      console.log("Couldn't find video:", video);
      return;
    }

    let gl = this.contexts[idx];

    gl.canvas.width = video.videoWidth;
    gl.canvas.height = video.videoHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
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
    const width = 1280;
    const height = 720;
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

  updateTexture(gl, texture, video) {
    if (video.currentTime === 0) {
      return;
    }

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      video,
    );
    // gl.activeTexture(gl.TEXTURE0);
  }

  createMatrix(video) {
    let idx = this.videos.indexOf(video);
    if (idx === -1) {
      console.log("Couldn't find video:", video);
    }

    while (this.matrices.length <= idx) {
      this.matrices.push([]);
    }
  }

  calculateMatrices() {
    for (var v = 0; v < this.videos.length; v++) {
      if (this.matrices[v] === void 0) {
        this.matrices.push([]);
      }

      this.calculateMatrix(this.videos[v]);
    }
  }

  calculateMatrix(video) {
    let { shapes } = this.state;

    let idx = this.videos.indexOf(video);
    if (idx === -1) {
      console.log("Couldn't find video:", video);
    }

    let widthI = video.videoWidth;
    let heightI = video.videoHeight;

    // let widthO = this.contexts[idx].canvas.width;
    // let heightO = this.contexts[idx].canvas.height;

    let widthO = video.videoWidth;
    let heightO = video.videoHeight;

    let matrices = this.matrices[idx];
    for (var i = 0; i < shapes.length; i++) {
      if (matrices[i] === void 0) {
        matrices.push(null);
      }

      let shape = shapes[i];
      let { input, output } = shape.points;

      let transformedI = input.map((pnt) => {
        return [(pnt[0] * widthI) | 0, (pnt[1] * heightI) | 0];
      });

      let transformedO = output.map((pnt) => {
        return [(pnt[0] * widthO) | 0, (pnt[1] * heightO) | 0];
      });

      matrices[i] = this.matrixFromTriangles(transformedI, transformedO);
    }
  }

  inverse(matrix) {
    const { a, b, c, d, e, f } = matrix;
    const denom = a * d - b * c;

    return {
      a: d / denom,
      b: b / -denom,
      c: c / -denom,
      d: a / denom,
      e: (d * e - c * f) / -denom,
      f: (b * e - a * f) / denom,
    };
  }

  transform(...matrices) {
    matrices = Array.isArray(matrices[0]) ? matrices[0] : matrices;

    const multiply = (m1, m2) => {
      return {
        a: m1.a * m2.a + m1.c * m2.b,
        c: m1.a * m2.c + m1.c * m2.d,
        e: m1.a * m2.e + m1.c * m2.f + m1.e,
        b: m1.b * m2.a + m1.d * m2.b,
        d: m1.b * m2.c + m1.d * m2.d,
        f: m1.b * m2.e + m1.d * m2.f + m1.f,
      };
    };

    switch (matrices.length) {
      case 0:
        throw new Error("no matrices provided");

      case 1:
        return matrices[0];

      case 2:
        return multiply(matrices[0], matrices[1]);

      default: {
        const [m1, m2, ...rest] = matrices;
        const m = multiply(m1, m2);
        return transform(m, ...rest);
      }
    }
  }

  smoothMatrix(matrix, precision = 10000000000) {
    return {
      a: Math.round(matrix.a * precision) / precision,
      b: Math.round(matrix.b * precision) / precision,
      c: Math.round(matrix.c * precision) / precision,
      d: Math.round(matrix.d * precision) / precision,
      e: Math.round(matrix.e * precision) / precision,
      f: Math.round(matrix.f * precision) / precision,
    };
  }

  matrixFromTriangles(t1, t2) {
    const px1 = t1[0][0];
    const py1 = t1[0][1];
    const px2 = t2[0][0];
    const py2 = t2[0][1];

    // point q = second point of the triangle
    const qx1 = t1[1][0];
    const qy1 = t1[1][1];
    const qx2 = t2[1][0];
    const qy2 = t2[1][1];

    // point r = third point of the triangle
    const rx1 = t1[2][0];
    const ry1 = t1[2][1];
    const rx2 = t2[2][0];
    const ry2 = t2[2][1];

    const r1 = {
      a: px1 - rx1,
      b: py1 - ry1,
      c: qx1 - rx1,
      d: qy1 - ry1,
      e: rx1,
      f: ry1,
    };
    const r2 = {
      a: px2 - rx2,
      b: py2 - ry2,
      c: qx2 - rx2,
      d: qy2 - ry2,
      e: rx2,
      f: ry2,
    };

    const inverseR1 = this.inverse(r1);
    const affineMatrix = this.transform([r2, inverseR1]);

    // round the matrix elements to smooth the finite inversion
    return this.smoothMatrix(affineMatrix);
  }

  applyToPoint(matrix, point) {
    return [
      matrix.a * point[0] + matrix.c * point[1] + matrix.e,
      matrix.b * point[0] + matrix.d * point[1] + matrix.f,
    ];
  }

  resetVideo(idx) {
    let video = this.videos[idx];
    let gl = this.contexts[idx];

    if (!!video) {
      video.pause();
      video.removeAttribute("src");
      video.load();

      gl.clear(gl.COLOR_BUFFER_BIT);

      this.videos.splice(idx, 1);
      this.contexts.splice(idx, 1);
      this.matrices.splice(idx, 1);
      this.textures.splice(idx, 1);
      this.glAttrs.splice(idx, 1);

      gl.canvas.parentNode.removeChild(gl.canvas);
      video.parentNode.removeChild(video);
    }

    this.reset_video = idx;
  }

  loadVideo(file) {
    if (this.reset_video === null) {
      return;
    }

    let vid = document.createElement("video");
    document.querySelector(".videos").appendChild(vid);

    vid.playsInline = true;
    vid.loop = true;
    vid.muted = true;
    vid.addEventListener("loadedmetadata", (e) => {
      setTimeout(() => {
        this.calculateMatrix(e.target);
        this.updateContext(e.target);

        console.log(vid);
        vid.play();
      }, 100);
    });
    vid.src = URL.createObjectURL(file);

    this.createVideo(vid);
    this.createMatrix(vid);
    this.reset_video = null;
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

  setupListeners() {
    window.addEventListener("mousedown", (e) => {
      if (!this.ui) {
        return;
      }

      let { checkPoints } = this.ui;
      let { videos, pause } = this.output;

      videos.map((video) => {
        video.pause();
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
        video.play();
      });

      // play.call(this.output);
      setSelectedPoint.call(this.ui, null);
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.ui) {
        return;
      }

      let { selectedPoint, movePoint } = this.ui;
      let { videos, drawFrame, calculateMatrices } = this.output;

      if (selectedPoint !== null) {
        movePoint.call(this.ui, e);
        calculateMatrices.call(this.output);
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

      let { layer, setLayer } = this.ui;

      if (e.keyCode === 32) {
        setLayer.call(this.ui, layer === "input" ? "output" : "input");
      }
    });

    window.addEventListener("message", (event) => {
      if (typeof event.data !== "object") {
        let data = JSON.parse(event.data);

        if (data.action === "update_state") {
          let oldState = this.state;

          this.state = data.state;
          if (oldState === null) {
            this.output = new Output(this.state);
            this.ui = new UI(this.state);
            this.setup();
          } else {
            this.output.updateState.call(this.output, this.state);
            this.ui.updateState.call(this.ui, this.state);

            if (oldState.shapes.length !== this.state.shapes.length) {
              console.log("Calculating Matrices");
              this.output.calculateMatrices.call(this.output);
            }
          }
        } else if (data.action === "reset_video") {
          let { videoIdx } = data;
          let { resetVideo } = this.output;

          resetVideo.call(this.output, videoIdx);
        }
      } else {
        let { loadVideo } = this.output;

        loadVideo.call(this.output, event.data);
      }

      // localStorage.setItem("zones", JSON.stringify(this.zones));
    });
  }
}

let app = null;
window.addEventListener("load", () => {
  app = new App();
});
