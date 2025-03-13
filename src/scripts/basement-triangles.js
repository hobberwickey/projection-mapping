class LFO {
  constructor(min, max, interval) {
    this.min = min;
    this.max = max;
    this.interval = interval;
    this.epoch = Date.now();
  }

  getSin = () => {
    const perc = this.getState();
    return (
      this.min +
      (1 + Math.sin((perc * 360 * Math.PI) / 180)) * ((this.max - this.min) / 2)
    );
  };
  getState = () => {
    const ms = this.interval * 1000;
    return ((Date.now() - this.epoch) % ms) / ms;
  };
}

let tri1Int = null;
let tri2Int = null;
let tri3Int = null;

let bgInt = null;

let tri1LFO1 = new LFO(0, 1, 60);
let tri1LFO2 = new LFO(0, 1, 140);
let tri2LFO1 = new LFO(0, 1, 70);
let tri2LFO2 = new LFO(0, 1, 150);
let tri3LFO1 = new LFO(0, 1, 80);
let tri3LFO2 = new LFO(0, 1, 165);

let bgLFO1 = new LFO(0.2, 0.8, 120);
let bgLFO2 = new LFO(0.2, 0.8, 330);
let bgLFO3 = new LFO(0.2, 0.8, 260);

(() => {
  tri1Int = setInterval(() => {
    let opacity1 = tri1LFO1.getSin();
    let opacity2 = tri1LFO2.getSin();

    let shapes = app.state.groups[1].shapes;

    for (let i = 0; i < shapes.length; i++) {
      app.state.shapes[shapes[i]].opacity[0] = opacity1;
      app.state.shapes[shapes[i]].opacity[1] = opacity2;
    }

    app.setState(app.state);
  }, 100);

  tri2Int = setInterval(() => {
    let opacity1 = tri2LFO1.getSin();
    let opacity2 = tri2LFO2.getSin();

    let shapes = app.state.groups[2].shapes;

    for (let i = 0; i < shapes.length; i++) {
      app.state.shapes[shapes[i]].opacity[0] = opacity1;
      app.state.shapes[shapes[i]].opacity[1] = opacity2;
    }

    app.setState(app.state);
  }, 100);

  tri3Int = setInterval(() => {
    let opacity1 = tri2LFO1.getSin();
    let opacity2 = tri2LFO2.getSin();

    let shapes = app.state.groups[3].shapes;

    for (let i = 0; i < shapes.length; i++) {
      app.state.shapes[shapes[i]].opacity[0] = opacity1;
      app.state.shapes[shapes[i]].opacity[1] = opacity2;
    }

    app.setState(app.state);
  }, 100);

  bgInt = setInterval(() => {
    let opacity1 = bgLFO1.getSin();
    let opacity2 = bgLFO2.getSin();
    let opacity3 = bgLFO3.getSin();

    let shapes = app.state.groups[4].shapes;

    for (let i = 0; i < shapes.length; i++) {
      app.state.shapes[shapes[i]].opacity[2] = opacity1;
      app.state.shapes[shapes[i]].opacity[3] = opacity2;
      app.state.shapes[shapes[i]].opacity[4] = opacity3;
    }

    app.setState(app.state);
  }, 100);
})();
