const defaultInputSections = [];
const defaultOutputSections = [];

class Screen {
  constructor() {
    this.selected = 0;
    this.pointSize = 10;
    this.fps = document.querySelector("#fps");
    this.layer = "output";
    this.srcs = [
      "/videos/clouds.mp4",
      "/videos/rain.mp4",
      "/videos/snow.mp4",
      "/videos/bbc_crabs.mp4",
      // "/videos/crab_rave.mp4",
    ];
    this.videos = [];
    this.zoneColors = {
      input: [
        [255, 0, 0],
        [255, 0, 0],
        [255, 0, 0],
        [255, 0, 0],
        [255, 0, 0],
      ],
      output: [
        [255, 255, 0],
        [255, 255, 0],
        [255, 255, 0],
        [255, 255, 0],
        [255, 255, 0],
      ],
    };
    this.contextWidth = 1280;
    this.contextHeight = 800;

    this.ui = document.querySelector("#ui").getContext("2d");
    this.uiOpacity = 0;
    this.uiOpacityTimer = null;

    // Calculated
    this.zones = JSON.parse(localStorage.getItem("zones")) || [
      {
        input: JSON.parse(JSON.stringify(defaultInputSections)),
        output: JSON.parse(JSON.stringify(defaultOutputSections)),
      },
      {
        input: JSON.parse(JSON.stringify(defaultInputSections)),
        output: JSON.parse(JSON.stringify(defaultOutputSections)),
      },
      {
        input: JSON.parse(JSON.stringify(defaultInputSections)),
        output: JSON.parse(JSON.stringify(defaultOutputSections)),
      },
      {
        input: JSON.parse(JSON.stringify(defaultInputSections)),
        output: JSON.parse(JSON.stringify(defaultOutputSections)),
      },
      // {
      //   input: JSON.parse(JSON.stringify(defaultInputSections)),
      //   output: JSON.parse(JSON.stringify(defaultOutputSections)),
      // },
    ];
    this.pointClouds = null;
    this.matrices = this.videos.map((v) => null);
    this.buffers = this.videos.map((v) => null);
    this.contexts = this.videos.map((v) => null);

    this.selectedZone = null;
    this.selectedTri = null;
    this.selectedPoint = null;

    this.srcs.map((src, idx) => {
      let vid = document.createElement("video");
      document.querySelector(".videos").appendChild(vid);

      vid.loop = true;
      vid.muted = true;
      vid.addEventListener("loadedmetadata", () => {
        setTimeout(() => {
          // this.calculatePointClouds();
          this.createContext(idx);
          this.createBuffers(idx);
          this.calculateMatrix(idx);
          this.step(idx);
          this.drawUI();
        }, 100);
      });
      vid.src = src;

      this.videos.push(vid);
    });

    window.addEventListener("mousedown", (e) => {
      this.videos.map((video) => {
        video.pause();
      });

      this.checkPoints(e);
    });

    window.addEventListener("mouseup", () => {
      this.videos.map((video) => {
        video.play();
      });

      this.selectedZone = null;
      this.selectedTri = null;
      this.selectedPoint = null;
    });

    window.addEventListener("mousemove", (e) => {
      if (
        this.selectedZone !== null &&
        this.selectedTri !== null &&
        this.selectedPoint !== null
      ) {
        this.movePoint(e);
        // this.calculatePointClouds();
        this.calculateMatrices();

        for (var i = 0; i < this.videos.length; i++) {
          this.drawFrame(i);
        }
      }
    });

    window.addEventListener("mousemove", () => {
      this.uiOpacity = 1;
      if (this.uiOpacityTimer !== null) {
        clearTimeout(this.uiOpacityTimer);
      }

      let opacityFn = () => {
        this.uiOpacity -= 0.02;

        if (this.uiOpacity > 0) {
          this.uiOpacityTimer = setTimeout(opacityFn, 30);
        } else {
          this.uiOpacity = 0;
          this.uiOpacityTimer = null;
        }
      };
      this.uiOpacityTimer = setTimeout(opacityFn, 1000);
      this.drawUI();
    });

    window.addEventListener("keypress", (e) => {
      if (e.keyCode === 32) {
        this.layer = this.layer === "input" ? "output" : "input";
      }
    });

    window.addEventListener(
      "message",
      (event) => {
        let data = JSON.parse(event.data);
        if (data.action === "add_triangles") {
          for (var i = 0; i < data.triangles.length; i++) {
            let triangle = data.triangles[i];

            for (var j = 0; j < this.zones.length; j++) {
              let zone = this.zones[j];

              zone.input.push(JSON.parse(JSON.stringify(triangle)));
              zone.output.push(JSON.parse(JSON.stringify(triangle)));
            }
          }

          for (var i = 0; i < this.videos.length; i++) {
            this.calculateMatrix(i);
          }
        } else if (data.action === "update_opacity") {
          let { videoIdx, groupIdx, opacity } = data;

          try {
            this.zones[videoIdx].output[groupIdx * 2][3] = opacity;
            this.zones[videoIdx].output[groupIdx * 2 + 1][3] = opacity;
          } catch (e) {
            console.log(videoIdx, groupIdx);
          }
        }

        localStorage.setItem("zones", JSON.stringify(this.zones));
      },
      false,
    );
    // this.drawUI();
  }

  // connect(e) {
  //     e.target.value.cancelVideoFrameCallback(animation_handle);
  //     step();
  // }

  step(idx) {
    // let start = Date.now();
    this.drawFrame(idx);
    this.videos[idx].requestVideoFrameCallback(this.step.bind(this, idx));
    // console.log(Date.now() - start);
  }

  // _drawFrame(idx) {
  //   let start = Date.now();
  //   let video = this.videos[idx];
  //   let pointCloud = this.pointClouds[idx];
  //   let matrices = this.matrices[idx];
  //   let buffer = this.buffers[idx];

  //   let iWidth = buffer.canvas.width;
  //   let iHeight = buffer.canvas.height;

  //   let oWidth = this.contextWidth;
  //   let oHeight = this.contextHeight;

  //   buffer.drawImage(video, 0, 0, iWidth, iHeight);
  //   let iData = buffer.getImageData(0, 0, iWidth, iHeight);

  //   this.ctx.clearRect(0, 0, oWidth, oHeight);
  //   let oData = this.ctx.getImageData(0, 0, oWidth, oHeight);

  //   let zLength = pointCloud.length;
  //   for (var i = 0; i < zLength; i++) {
  //     let tLength = pointCloud[i].length;
  //     let matrix = matrices[i];

  //     for (var j = 0; j < tLength; j++) {
  //       let iClrIdx = (pointCloud[i][j][0] + pointCloud[i][j][1] * iWidth) << 2;
  //       let oCoords = this.applyToPoint(matrix, pointCloud[i][j]);
  //       let oClrIdx = ((oCoords[0] | 0) + (oCoords[1] | 0) * oWidth) << 2;

  //       oData.data[oClrIdx] = iData.data[iClrIdx];
  //       oData.data[oClrIdx + 1] = iData.data[iClrIdx + 1];
  //       oData.data[oClrIdx + 2] = iData.data[iClrIdx + 2];
  //       oData.data[oClrIdx + 3] = iData.data[iClrIdx + 3];
  //     }
  //   }

  //   this.ctx.putImageData(oData, 0, 0);

  //   // video.requestVideoFrameCallback(this.step.bind(this, idx));
  // }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s
      ? l === r
        ? (g - b) / s
        : l === g
          ? 2 + (b - r) / s
          : 4 + (r - g) / s
      : 0;
    return [
      60 * h < 0 ? 60 * h + 360 : 60 * h,
      100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
      (100 * (2 * l - s)) / 2,
    ];
  }

  drawFrame(idx) {
    let start = Date.now();
    let video = this.videos[idx];
    let ctx = this.contexts[idx];

    if (!video || !ctx) {
      console.log(idx);
      return;
    }

    // let pointCloud = this.pointClouds[idx];
    let matrices = this.matrices[idx];
    let buffer = this.buffers[idx];
    let context = this.contexts[idx];

    let iWidth = buffer.canvas.width;
    let iHeight = buffer.canvas.height;

    let oWidth = context.canvas.width;
    let oHeight = context.canvas.height;

    this.contexts[idx].clearRect(0, 0, oWidth, oHeight);

    let zoneI = this.zones[idx].input;
    let zoneO = this.zones[idx].output;

    if (!this.matrices[idx]) {
      return;
    }

    for (var j = 0; j < zoneI.length; j++) {
      let pnt = zoneI[j];
      let opacity = +zoneO[j][3];

      if (opacity < 0.1) {
        continue;
      }

      let originX = (iWidth * pnt[0][0]) | 0;
      let originY = (iHeight * pnt[0][1]) | 0;
      let matrix = this.matrices[idx][j];

      if (!matrix) {
        console.log(j, this.matrices);
        continue;
      }

      let minX = originX;
      let maxX = originX;
      let minY = originY;
      let maxY = originY;

      buffer.clearRect(0, 0, buffer.canvas.width, buffer.canvas.height);
      buffer.save();
      buffer.beginPath();
      buffer.moveTo(originX, originY);
      for (var k = 1; k < 3; k++) {
        let x = (iWidth * pnt[k][0]) | 0;
        let y = (iHeight * pnt[k][1]) | 0;

        // if (x < minX) minX = x;
        // if (x > maxX) maxX = x;
        // if (y < minY) minY = y;
        // if (y > maxY) maxY = y;

        buffer.lineTo(x, y);
      }
      buffer.lineTo(originX, originY);
      buffer.clip();
      buffer.drawImage(video, 0, 0, iWidth, iHeight);
      buffer.restore();

      // let imgData = buffer.getImageData(
      //   0,
      //   0,
      //   buffer.canvas.width,
      //   buffer.canvas.height,
      // );

      // let data = imgData.data;
      // let imgDataLen = data.length;

      // for (let l = 0; l < imgDataLen; l += 4) {
      //   if (data[l + 3] !== 0) {
      //     let [h, s, b] = this.rgbToHsl(data[l], data[l + 1], data[l + 2]);
      //     data[l + 3] = (b / 100) * 255;
      //   }
      // }

      // buffer.putImageData(imgData, 0, 0);

      this.contexts[idx].setTransform(
        matrix.a,
        matrix.b,
        matrix.c,
        matrix.d,
        matrix.e,
        matrix.f,
      );
      this.contexts[idx].globalAlpha = opacity;
      this.contexts[idx].drawImage(buffer.canvas, 0, 0, oWidth, oHeight);
      // this.contexts[idx].resetTransform();
    }

    this.fps.innerText = Date.now() - start;
    // console.log(idx, Date.now() - start);
  }

  isInsideTriangle(P, p1, p2, p3) {
    let x = P[0];
    let x1 = p1[0];
    let x2 = p2[0];
    let x3 = p3[0];

    let y = P[1];
    let y1 = p1[1];
    let y2 = p2[1];
    let y3 = p3[1];

    let full = Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    let first = Math.abs(x1 * (y2 - y) + x2 * (y - y1) + x * (y1 - y2));
    let second = Math.abs(x1 * (y - y3) + x * (y3 - y1) + x3 * (y1 - y));
    let third = Math.abs(x * (y2 - y3) + x2 * (y3 - y) + x3 * (y - y2));

    return Math.abs(first + second + third - full) < 0.0000000001;
  }

  calculatePointClouds() {
    // Cloud structure:
    // --video layer
    //   --zone layer
    //     --triangle layer

    let video_clouds = [];

    for (var v = 0; v < this.videos.length; v++) {
      let video = this.videos[v];
      let width = video.videoWidth;
      let height = video.videoHeight;

      let zone_clouds = [];
      for (var z = 0; z < this.zones.length; z++) {
        let zone = this.zones[z].input;

        for (var t = 0; t < zone.length; t++) {
          let triangle = zone[t];
          let transformed = triangle.map((tri) => {
            return [(tri[0] * width) | 0, (tri[1] * height) | 0];
          });

          let triangle_cloud = [];
          for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
              if (
                this.isInsideTriangle(
                  [x, y],
                  transformed[0],
                  transformed[1],
                  transformed[2],
                )
              ) {
                triangle_cloud.push([x, y]);
              }
            }
          }

          zone_clouds.push(triangle_cloud);
        }

        video_clouds.push(zone_clouds);
      }
    }

    this.pointClouds = video_clouds;
  }

  calculateMatrices() {
    // let video_matrices = [];

    for (var v = 0; v < this.videos.length; v++) {
      this.calculateMatrix(v);
    }

    // console.log(video_matrices);

    // this.matrices = video_matrices;
  }

  calculateMatrix(idx) {
    let video = this.videos[idx];
    let widthI = video.videoWidth;
    let heightI = video.videoHeight;

    // let widthO = this.contexts[idx].canvas.width;
    // let heightO = this.contexts[idx].canvas.height;

    let widthO = video.videoWidth;
    let heightO = video.videoHeight;

    let zone_matrices = [];
    for (var z = 0; z < this.zones.length; z++) {
      let zoneI = this.zones[z].input;
      let zoneO = this.zones[z].output;

      for (var t = 0; t < zoneI.length; t++) {
        let triangleI = zoneI[t];
        let transformedI = triangleI.map((tri) => {
          return [(tri[0] * widthI) | 0, (tri[1] * heightI) | 0];
        });

        let triangleO = zoneO[t];
        let transformedO = triangleO.map((tri) => {
          return [(tri[0] * widthO) | 0, (tri[1] * heightO) | 0];
        });

        let triangle_matrix = this.matrixFromTriangles(
          transformedI,
          transformedO,
        );

        zone_matrices.push(triangle_matrix);
      }
    }

    this.matrices[idx] = zone_matrices;
  }

  createBuffers() {
    for (var i = 0; i < this.videos.length; i++) {
      this.createBuffer(i);
    }
  }

  createBuffer(idx) {
    let video = this.videos[idx];
    let buffer = document.createElement("canvas");

    buffer.width = video.videoWidth;
    buffer.height = video.videoHeight;

    let bufferCtx = buffer.getContext("2d", { willReadFrequently: true });
    this.buffers[idx] = bufferCtx;
  }

  createContexts() {
    for (var i = 0; i < this.videos.length; i++) {
      this.createContext(i);
    }
  }

  createContext(idx) {
    console.log("Creating Context:", idx);
    let video = this.videos[idx];
    let canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.contexts[idx] = ctx;
    document.querySelector(".contexts").appendChild(canvas);
  }

  drawUI() {
    this.ui.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);
    this.drawPoints();
    this.tracePoints();

    if (this.uiOpacity !== 0) {
      window.requestAnimationFrame(this.drawUI.bind(this));
    }
  }

  tracePoints() {
    let zoneCnt = this.zones.length;

    for (var i = 0; i < zoneCnt; i++) {
      let clr = this.zoneColors[this.layer][i];
      this.ui.strokeStyle = `rgba(${clr[0]},${clr[1]},${clr[2]},${this.uiOpacity})`;

      let zone = this.zones[i][this.layer];
      let pntCnt = zone.length;

      let width = this.contextWidth;
      let height = this.contextHeight;

      for (var j = 0; j < pntCnt; j++) {
        let pnt = zone[j];
        let originX = (width * pnt[0][0]) | 0;
        let originY = (height * pnt[0][1]) | 0;

        this.ui.beginPath();
        this.ui.moveTo(originX, originY);
        for (var k = 1; k < 3; k++) {
          let x = (width * pnt[k][0]) | 0;
          let y = (height * pnt[k][1]) | 0;

          this.ui.lineTo(x, y);
        }
        this.ui.lineTo(originX, originY);
        this.ui.stroke();
        this.ui.closePath();
      }
    }
  }

  drawPoints() {
    this.loopPoints(this.drawPoint.bind(this));
  }

  drawPoint(x, y, zoneIdx) {
    let offset = this.pointSize >> 1;
    let clr = this.zoneColors[this.layer][zoneIdx];

    // console.log(this.uiOpacity);

    this.ui.fillStyle = `rgba(${clr[0]},${clr[1]},${clr[2]},${this.uiOpacity})`;
    this.ui.fillRect(x - offset, y - offset, this.pointSize, this.pointSize);

    return true;
  }

  checkPoints(e) {
    this.loopPoints(this.checkPoint.bind(this, e));
  }

  checkPoint(e, x, y, zoneIdx, quadIdx, pntIdx) {
    let offset = this.pointSize >> 1;
    let mouseX = e.pageX * (this.contextWidth / window.innerWidth);
    let mouseY = e.pageY * (this.contextHeight / window.innerHeight);

    if (
      mouseX <= Math.max(x, 0) + offset &&
      mouseX >= Math.max(x, 0) - offset &&
      mouseY <= Math.max(y, 0) + offset &&
      mouseY >= Math.max(y, 0) - offset
    ) {
      this.selectedZone = zoneIdx;
      this.selectedTri = quadIdx;
      this.selectedPoint = pntIdx;

      return false;
    }
    return true;
  }

  movePoint(e) {
    // TODO: THIS is what needs to be calulated per video

    let x = e.pageX / window.innerWidth;
    let y = e.pageY / window.innerHeight;

    for (var i = 0; i < this.zones.length; i++) {
      // let surface = {
      //   input: this.buffers[i],
      //   output: this.contexts[i].canvas,
      // }[this.layer];
      // let width = surface.width;
      // let height = surface.height;

      // let x = (e.pageX * (width / window.innerWidth)) / width;
      // let y = (e.pageY * (height / window.innerHeight)) / height;

      let pnt = this.zones[i][this.layer][this.selectedTri][this.selectedPoint];

      pnt[0] = x;
      pnt[1] = y;
    }

    localStorage.setItem("zones", JSON.stringify(this.zones));
  }

  loopPoints(fn) {
    let zoneCnt = this.zones.length;
    let pntSize = this.pointSize;

    for (var i = 0; i < zoneCnt; i++) {
      let zone = this.zones[i][this.layer];
      let pntCnt = zone.length;
      let surface = {
        input: this.ui.canvas,
        output: this.ui.canvas,
      }[this.layer];
      let width = surface.width;
      let height = surface.height;

      for (var j = 0; j < pntCnt; j++) {
        let pnt = zone[j];
        let x;
        let y;

        for (var k = 0; k < 3; k++) {
          x = (width * pnt[k][0]) | 0;
          y = (height * pnt[k][1]) | 0;

          let cont = fn(x, y, i, j, k);
          if (!cont) {
            return;
          }
        }
      }
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
}

let screen = null;
window.addEventListener("load", () => {
  screen = new Screen();
});
