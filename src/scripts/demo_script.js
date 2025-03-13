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

(() => {
  let lfo1 = new LFO(0, 1, 35);
  let lfo2 = new LFO(0, 1, 67);

  let lfoG = new LFO(0, 1, 10);

  let groupIdx = 0;

  let groups = [
    [8, 9, 10, 11, 12, 13, 14, 15],
    [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23,
    ],
    [0, 1, 2, 3, 4, 5, 6, 7],
    [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23,
    ],
    [16, 17, 18, 19, 20, 21, 22, 23],
    [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23,
    ],
  ];

  let dir = "up";
  let last = lfoG.getSin();
  setInterval(() => {
    let groupOpacity = lfoG.getSin();

    if (groupOpacity - last < 0) {
      if (dir === "up") {
        groupIdx = (groupIdx + 1) % groups.length;
      }

      dir = "down";
    } else {
      dir = "up";
    }

    last = groupOpacity;

    let vidOpacity1 = lfo1.getSin();
    let vidOpacity2 = lfo2.getSin();

    let shapes = app.state.shapes;

    for (let i = 0; i < shapes.length; i++) {
      shapes[i].opacity[0] = vidOpacity1;
      shapes[i].opacity[1] = vidOpacity2;

      let group = groups[groupIdx];
      if (group.includes(i)) {
        for (let j = 0; j < 6; j++) {
          shapes[i].opacity[j] = shapes[i].opacity[j] * groupOpacity;
        }
      }
    }

    app.setState(app.state);
  }, 100);
})();
