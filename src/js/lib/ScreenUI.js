export class UI {
  constructor(state) {
    this.state = state;

    this.pointSize = 10;
    this.layer = "output";
    this.layerColor = {
      input: [255, 0, 0],
      output: [0, 0, 255],
    };

    this.moving = false;
    this.shifted = false;
    this.selected = null;
    this.selectedShapes = [];

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

  startMove() {
    this.moving = true;
  }

  stopMove() {
    this.moving = false;
  }

  shiftDown() {
    this.shifted = true;
  }

  shiftUp() {
    this.shifted = false;
  }

  drawUI() {
    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;

    ctx.clearRect(0, 0, width, height);

    this.drawShapes();

    // this.drawPoints();
    // this.tracePoints();
  }

  select(e) {
    if (this.selectDisabled) {
      return;
    }

    let { shapes } = this.state;
    let { selectedShape, selectedPoint } = this;

    let relX = e.pageX / window.innerWidth;
    let relY = e.pageY / window.innerHeight;

    // TODO: So... I think we can actually use the same function
    // For the triangles and the quads, just need to modify
    // the check points to return an array of selected points
    // and then the move function should move all the points
    // in the selected array since the shared corners for the
    // quads will just then both move

    let selectedShapes = [];
    for (var i = 0; i < shapes.length; i++) {
      let shape = shapes[i];
      let { type } = shapes[i];

      if (type === "triangle" || type === "quad") {
        let selected = this.checkTriangle(relX, relY, shape, i);
        if (selected !== null) {
          selectedShapes.push(selected);
        }
      }
    }

    selectedShapes.sort((a, b) => {
      return (b.points || []).length - (a.points || []).length;
    });

    let selected = this.selected;
    let first = selectedShapes[0] || null;
    let current = selectedShapes.find((s) => {
      return (
        s.shape === selected?.shape &&
        (s.points || []).every((points) => {
          return (selected?.points || []).find(
            (p) => p[0] === points[0] && p[1] === points[1],
          );
        })
      );
    });

    this.selectedShapes = selectedShapes;
    if (
      !current ||
      (first?.points || []).length > (current?.points || []).length ||
      this.shifted
    ) {
      this.selectNext();
    }
    this.drawUI();
  }

  selectNext() {
    let { selected, selectedShapes } = this;

    // console.log(selectedShapes);

    let current = selectedShapes.findIndex((s) => {
      return (
        s.shape === selected?.shape &&
        (s.points || []).every((points) => {
          return (selected?.points || []).find(
            (p) => p[0] === points[0] && p[1] === points[1],
          );
        })
      );
    });

    // console.log(current);

    if (current >= 0) {
      this.selected = selectedShapes[(current + 1) % selectedShapes.length];
    } else {
      this.selected = selectedShapes[0] || null;
    }
  }

  checkTriangle(relX, relY, shape, shapeIdx) {
    let { tris } = shape;

    let points = this.checkTrianglePoints(relX, relY, shape, this.layer);
    if (points.length > 0) {
      return {
        shape: shapeIdx,
        points: points,
      };
    }

    for (let i = 0; i < tris.length; i++) {
      let p = tris[i][this.layer];

      let x = relX;
      let y = relY;
      let ax = p[0][0];
      let ay = p[0][1];
      let bx = p[1][0];
      let by = p[1][1];
      let cx = p[2][0];
      let cy = p[2][1];

      let det = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);

      if (
        det * ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) >= 0 &&
        det * ((cx - bx) * (y - by) - (cy - by) * (x - bx)) >= 0 &&
        det * ((ax - cx) * (y - cy) - (ay - cy) * (x - cx)) >= 0
      ) {
        return {
          shape: shapeIdx,
          points: [],
        };
      }
    }

    return null;
  }

  checkTrianglePoints(relX, relY, shape, layer) {
    let { pointSize } = this;
    let { tris } = shape;

    let selected = [];

    let offsetX = (pointSize >> 1) * (1 / window.innerWidth);
    let offsetY = (pointSize >> 1) * (1 / window.innerHeight);
    for (let i = 0; i < tris.length; i++) {
      let points = tris[i][layer];

      for (let j = 0; j < points.length; j++) {
        let x = points[j][0];
        let y = points[j][1];

        let minX = Math.min(Math.max(x - offsetX, 0), 1 - offsetX * 2);
        let minY = Math.min(Math.max(y - offsetY, 0), 1 - offsetY * 2);
        let maxX = Math.max(Math.min(x + offsetX, 1), offsetX * 2);
        let maxY = Math.max(Math.min(y + offsetY, 1), offsetY * 2);

        if (relX <= maxX && relX >= minX && relY <= maxY && relY >= minY) {
          selected.push([i, j]);
        }
      }
    }

    return selected;
  }

  drawShapes() {
    let { shapes } = this.state;
    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;

    for (var i = 0; i < shapes.length; i++) {
      let { type } = shapes[i];

      if (type === "triangle") {
        this.drawTri(shapes[i]);
      }

      if (type === "quad") {
        this.drawQuad(shapes[i]);
      }
    }

    //   for (var j = 0; j < tris.length; j++) {
    //     let points = tris[j][this.layer];

    //     if (type !== "ellipse") {
    //       for (var k = 0; k < points.length; k++) {
    //         let x = (width * points[k][0]) | 0;
    //         let y = (height * points[k][1]) | 0;

    //         this.drawPoint(x, y);
    //       }
    //     } else {
    //       // TODO: Draw the control points
    //     }
    //   }
    // }
  }

  drawTri(shape) {
    let shapeIdx = this.state.shapes.indexOf(shape);

    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;
    let { tris } = shape;
    let { selected } = this;

    for (var j = 0; j < tris.length; j++) {
      let points = tris[j][this.layer];

      for (var k = 0; k < points.length; k++) {
        let isSelectedPoint =
          selected?.shape === shapeIdx &&
          (selected?.points || []).find((t) => t[0] === j && t[1] === k);

        let x = (width * points[k][0]) | 0;
        let y = (height * points[k][1]) | 0;

        this.drawPoint(x, y, isSelectedPoint);
      }

      this.tracePoints(
        points[0][0],
        points[0][1],
        points[1][0],
        points[1][1],
        selected?.shape === shapeIdx,
      );
      this.tracePoints(
        points[1][0],
        points[1][1],
        points[2][0],
        points[2][1],
        selected?.shape === shapeIdx,
      );
      this.tracePoints(
        points[2][0],
        points[2][1],
        points[0][0],
        points[0][1],
        selected?.shape === shapeIdx,
      );
    }
  }

  drawQuad(shape) {
    let shapeIdx = this.state.shapes.indexOf(shape);

    let { selected } = this;
    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;
    let { tris } = shape;

    for (var j = 0; j < tris.length; j++) {
      let points = tris[j][this.layer];

      for (var k = 0; k < points.length; k++) {
        let isSelectedPoint =
          selected?.shape === shapeIdx &&
          (selected?.points || []).find((t) => t[0] === j && t[1] === k);

        let x = (width * points[k][0]) | 0;
        let y = (height * points[k][1]) | 0;

        this.drawPoint(x, y, isSelectedPoint);
      }
    }

    let points1 = tris[0][this.layer];
    let points2 = tris[1][this.layer];

    let isSelectedShape = this.tracePoints(
      points1[0][0],
      points1[0][1],
      points2[1][0],
      points2[1][1],
      selected?.shape === shapeIdx,
    );

    this.tracePoints(
      points2[1][0],
      points2[1][1],
      points1[2][0],
      points1[2][1],
      selected?.shape === shapeIdx,
    );
    this.tracePoints(
      points1[2][0],
      points1[2][1],
      points1[1][0],
      points1[1][1],
      selected?.shape === shapeIdx,
    );
    this.tracePoints(
      points1[1][0],
      points1[1][1],
      points1[0][0],
      points1[0][1],
      selected?.shape === shapeIdx,
    );
  }

  tracePoints(x1, y1, x2, y2, selected) {
    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;

    let clr = selected ? [255, 255, 0] : this.layerColor[this.layer];

    ctx.strokeStyle = `rgba(${clr[0]},${clr[1]},${clr[2]},${this.opacity.value})`;

    let originX = Math.max((width * x1) | 0, 5);
    let originY = Math.max((height * y1) | 0, 5);

    let destX = Math.max((width * x2) | 0, 5);
    let destY = Math.max((height * y2) | 0, 5);

    ctx.beginPath();
    ctx.moveTo(originX, originY);

    ctx.lineTo(destX, destY);

    ctx.lineTo(originX, originY);
    ctx.stroke();
    ctx.closePath();
  }

  drawPoint(x, y, selected) {
    let { ctx } = this.elements;
    let { width, height } = ctx.canvas;

    let clr = selected ? [255, 255, 0] : this.layerColor[this.layer];
    let opacity = this.opacity.value;

    let offset = this.pointSize >> 1;
    let minX = Math.min(Math.max(x - offset, 0), width - this.pointSize);
    let minY = Math.min(Math.max(y - offset, 0), height - this.pointSize);

    ctx.fillStyle = `rgba(${clr[0]},${clr[1]},${clr[2]},${opacity})`;
    ctx.fillRect(minX, minY, this.pointSize, this.pointSize);

    return true;
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
    if (!this.moving || !this.selected) {
      return;
    }

    let x = e.pageX / window.innerWidth;
    let y = e.pageY / window.innerHeight;
    let { shapes } = this.state;
    let { selected, layer } = this;

    let shape = shapes[selected.shape];
    let points = selected.points || [];

    [x, y] = this.snapPoint(x, y);

    for (let i = 0; i < points.length; i++) {
      let tri = shape.tris[points[i][0]];
      tri[layer][points[i][1]][0] = x;
      tri[layer][points[i][1]][1] = y;
    }

    if (!!window.opener) {
      window.opener.postMessage(
        JSON.stringify({
          action: "update_state",
          state: this.state,
        }),
      );
    }
  }

  snapPoint(relX, relY) {
    let { selected } = this;
    let { shapes } = this.state;

    const getPoint = (match, shape, layer) => {
      let triIdx = match[0];
      let pointIdx = match[1];

      let tri = shape.tris[triIdx][layer];
      let point = tri[pointIdx];

      return [...point];
    };

    let oppLayer = this.layer === "input" ? "output" : "input";
    let matches = this.checkTrianglePoints(
      relX,
      relY,
      shapes[selected.shape],
      oppLayer,
    );

    if (matches.length > 0) {
      return getPoint(matches[0], shapes[selected.shape], oppLayer);
    }

    for (let i = 0; i < shapes.length; i++) {
      if (i === selected.shape) {
        continue;
      }

      let matches = this.checkTrianglePoints(relX, relY, shapes[i], this.layer);

      if (matches.length > 0) {
        return getPoint(matches[0], shapes[i], this.layer);
      }
    }

    return [relX, relY];
  }
}
