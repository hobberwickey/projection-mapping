import { Config } from "./libs/config.js";
import { Video } from "./libs/videos.js";
import { Effect } from "./libs/effects.js";
import { Group, Shape, GroupToggle } from "./libs/shapes.js";

const defaultTriangle = [
  [0.4, 0.4],
  [0.6, 0.4],
  [0.5, 0.6],
];

class App {
  constructor(config) {
    this.config = config;
    this.screen = null;

    this.colors = {
      bg: 25,
      fg: 186,
      hd: 200,
    };

    this.state =
      JSON.parse(localStorage.getItem("saves"))?.auto || this.defaultState();

    this.selectedVideos = [0];
    this.selectedGroup = 0;
    this.selectedEffect = 0;

    this.midiAccess = null;
    this.midiInput = null;
    this.midiOutput = null;

    this.setupVideos();
    this.setupGroups();
    this.setupEffects();
    this.setupMidi();
    this.setValues();

    this.launch();
  }

  id() {
    return (Math.random() * 1000000) | 0;
  }

  defaultState() {
    let { config } = this;

    return {
      videos: new Array(config.video_count).fill().map((_, idx) => {
        return {
          id: this.id(),
          label: `Video ${idx + 1}`,
          values: new Array(config.effect_count).fill().map(() => {
            return new Array(config.effect_parameter_count).fill(0);
          }),
        };
      }),

      effects: new Array(config.effect_count).fill().map((_, idx) => {
        return idx === 0 ? "cosine_pallet" : null;
      }),

      groups: new Array(config.group_count).fill().map((_, idx) => {
        return {
          id: this.id(),
          editable: idx !== 0,
          opacity: new Array(config.video_count).fill(0),
          label: idx === 0 ? "All" : `Group ${idx}`,
          shapes: [],
        };
      }),

      shapes: [
        {
          id: this.id(),
          type: "triangle",
          label: "Triangle 1",
          opacity: new Array(config.video_count).fill(0.5),
          points: {
            input: [
              [0, 0],
              [1, 0],
              [1, 1],
            ],
            output: [
              [0, 0],
              [1, 0],
              [1, 1],
            ],
          },
        },
        {
          id: this.id(),
          type: "triangle",
          label: "Triangle 2",
          opacity: new Array(config.video_count).fill(0.5),
          points: {
            input: [
              [0, 0],
              [0, 1],
              [1, 1],
            ],
            output: [
              [0, 0],
              [0, 1],
              [1, 1],
            ],
          },
        },
      ],

      // TODO: this shouldn't be hardcoded. Build a learn setting
      notes: {
        buttons: {
          48: 0,
          53: 1,
          50: 2,
          51: 3,
          49: 4,
          52: 5,
        },
        knobs: {
          56: 0,
          54: 1,
          55: 2,
        },
      },
    };
  }

  setupMidi() {
    let { buttons, knobs } = this.state.notes;

    const onMIDISuccess = (midiAccess) => {
      this.midiAccess = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
      for (const entry of this.midiAccess.inputs) {
        if (entry[1].id === "-1994529889") {
          this.midiInput = entry[1];
          entry[1].onmidimessage = (e) => {
            let note = e.data[1];
            let velocity = e.data[2];

            if (buttons.hasOwnProperty(note)) {
              let idx = buttons[note];

              let inputs = document.querySelectorAll("#videos .video");
              let input = inputs[idx].querySelector("input[type='radio']");

              input.checked = true;
              input.dispatchEvent(new Event("change", { bubbles: true }));
            } else if (knobs.hasOwnProperty(note)) {
              let idx = knobs[note];
              let inputs = document.querySelectorAll(
                ".inputs input[type='range']",
              );
              let input = inputs[idx];

              input.value = velocity / 127;
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }

            // if (note === 48) {
            //   this.selectedVideo = 0;
            // } else if (note === 53) {
            //   this.selectedVideo = 1;
            // } else if (note === 50) {
            //   this.selectedVideo = 2;
            // } else if (note === 51) {
            //   this.selectedVideo = 3;
            // } else if (note === 49) {
            //   this.selectedVideo = 4;
            // } else if (note === 52) {
            //   this.selectedVideo = 5;
            // } else if (note === 56) {
            //   let input = document.querySelectorAll(
            //     ".inputs input[type='range']",
            //   )[0];
            //   input.value = velocity / 127;
            //   input.dispatchEvent(new Event("input", { bubbles: true }));
            // } else if (note === 54) {
            //   let input = document.querySelectorAll(
            //     ".inputs input[type='range']",
            //   )[1];
            //   input.value = velocity / 127;
            //   input.dispatchEvent(new Event("input", { bubbles: true }));
            // } else if (note === 55) {
            //   let input = document.querySelectorAll(
            //     ".inputs input[type='range']",
            //   )[2];
            //   input.value = velocity / 127;
            //   input.dispatchEvent(new Event("input", { bubbles: true }));
            // }
          };
        }
        // if (entry[1].id === "325563316") {
        //   this.midiInput = entry[1];
        //   entry[1].onmidimessage = (e) => {
        //     console.log("APK", e);
        //   };
        // }
      }
      // for (const entry of this.midiAccess.outputs) {
      //   if (entry[1].id === "-173082528") {
      //     this.midiOutput = entry[1];
      //     this.midiOutput.send([0x90, 0x00, 0x03]);
      //   }
      // }
    };
    const onMIDIFailure = (msg) => {
      console.error(`Failed to get MIDI access - ${msg}`);
    };
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }

  // setupValues() {
  //   let vidCnt = this.config.video_count;
  //   let fxCnt = this.config.effect_count;

  //   for (var i = 0; i < vidCnt; i++) {
  //     let vidEffects = [];

  //     for (var j = 0; j < fxCnt; j++) {
  //       vidEffects.push({
  //         effect_a: 0,
  //         effect_b: 0,
  //         effect_c: 0,
  //       });
  //     }

  //     this.values.push(vidEffects);
  //   }
  // }

  launch() {
    if (!!this.screen) {
      return;
    }

    // this.rotateColors();

    document
      .querySelector("#launch")
      .addEventListener("click", this.popout.bind(this));

    document
      .querySelector("#add_triangle")
      .addEventListener("click", this.addShape.bind(this));

    document
      .querySelector("#slideout-handle")
      .addEventListener("click", this.toggleSlideout.bind(this));

    let inputs = document.querySelectorAll(".inputs input[type='range']");
    inputs[0].addEventListener(
      "input",
      this.updateEffect.bind(this, "opacity"),
    );
    inputs[1].addEventListener(
      "input",
      this.updateEffect.bind(this, "effect_a"),
    );
    inputs[2].addEventListener(
      "input",
      this.updateEffect.bind(this, "effect_b"),
    );

    window.addEventListener("message", (e) => {
      let data = JSON.parse(event.data);
      if (data.action === "update_state") {
        this.state = data.state;
      }
    });
  }

  popout() {
    this.screen = window.open("./screen.html");
    document.querySelector(".launch-overlay").style.display = "none";

    this.screen.addEventListener("load", () => {
      this.screen.postMessage(
        JSON.stringify({
          action: "update_state",
          state: this.state,
        }),
      );
    });
  }

  toggleSlideout() {
    let el = document.querySelector(".slideout");

    console.log(el);

    if (el.classList.contains("active")) {
      el.classList.remove("active");
      el.querySelector("#slideout-handle").setAttribute(
        "uk-icon",
        "chevron-double-left",
      );
    } else {
      el.classList.add("active");
      el.querySelector("#slideout-handle").setAttribute(
        "uk-icon",
        "chevron-double-right",
      );
    }
  }

  rotateColors() {
    this.colors.bg = (this.colors.bg + 0.05) % 360;
    this.colors.fg = (this.colors.fg + 0.02) % 360;
    this.colors.hd = (this.colors.hd + 0.03) % 360;

    document.body.style.backgroundColor = `hsl(${this.colors.bg}deg 20.54% 90.41%)`;
    document.querySelector("nav").style.backgroundColor =
      `hsl(${this.colors.hd}deg 20.54% 90.41%)`;
    document
      .querySelector(":root")
      .style.setProperty(
        "--fg-color",
        `hsl(${this.colors.fg}deg 20.54% 50.41%)`,
      );

    // window.requestAnimationFrame(this.rotateColors.bind(this));
  }

  // setupData() {
  //   // Pull from localStorage

  //   this.videos.push({
  //     label: `Video ${i + 1}`,
  //     values: new Array(this.config.group_count).fill(
  //       new Array(this.config.effect_count).fill({
  //         effect_a: 0,
  //         effect_b: 0,
  //         effect_c: 0,
  //       }),
  //     ),
  //   });
  // }

  setupVideos() {
    let { updateVideo, toggleVideo, selectedVideos } = this;
    let { videos } = this.state;

    for (var i = 0; i < videos.length; i++) {
      let video = new Video(
        i,
        videos[i],
        updateVideo.bind(this),
        toggleVideo.bind(this),
      );
      document.querySelector("#videos").appendChild(video.el);

      if (i === selectedVideos[0]) {
        video.el.classList.add("selected");
      }

      if (selectedVideos.includes(i)) {
        video.el.querySelector("input[type='radio']").checked = true;
      }
    }
  }

  setupEffects() {
    let { effects } = this.state;

    for (var i = 0; i < effects.length; i++) {
      let effect = new Effect(
        i,
        effects[i],
        this.selectEffect.bind(this),
        this.setEffect.bind(this),
      );

      if (this.selectedEffect === i) {
        effect.el
          .querySelector("input[type='radio']")
          .setAttribute("checked", true);
      }

      document.querySelector("#effects").appendChild(effect.el);
    }
  }

  setupGroups() {
    let { groups, shapes } = this.state;
    let { selectGroup } = this;

    for (var i = 0; i < groups.length; i++) {
      let group = new Group(i, groups[i], selectGroup.bind(this));
      document.querySelector(".slideout .groups").appendChild(group.el);

      if (i === this.selectedGroup) {
        group.el.querySelector("input[type='radio']").checked = true;
      }
    }

    for (var i = 0; i < shapes.length; i++) {
      let column = document.createElement("div");
      column.className = "column shape";

      let shape = new Shape(i, shapes[i]);
      column.appendChild(shape.el);

      document.querySelector(".slideout .table").appendChild(column);

      for (var j = 0; j < groups.length; j++) {
        let toggle = new GroupToggle(j, i, this.toggleGroup.bind(this));
        column.appendChild(toggle.el);
      }
    }
    // for (var i = 0; i < shapes.length; i++) {
    //   let shape = new Shape(i, shapes[i], this.selectShape.bind(this));
    //   let head = document.querySelector("#shapes thead");
    //   let last = [...head.querySelectorAll("th")].pop();
    //   document.querySelector("#shapes thead tr").insertBefore(shape.el, last);
    // }

    // for (var i = 0; i < groups.length; i++) {
    //   let group = new Group(i, groups[i]);

    //   let row = document.createElement("tr");
    //   let body = document.querySelector("#shapes tbody");

    //   row.className = "group-row";
    //   body.appendChild(row);
    //   row.appendChild(group.el);

    //   for (var j = 0; j < shapes.length; j++) {
    //     let groupToggle = new GroupToggle(groups[i], shapes[j]);
    //     row.appendChild(groupToggle.el);
    //   }
    // }
  }

  addShape() {
    if (!this.screen) {
      return;
    }

    let { shapes, groups } = this.state;

    let idx = shapes.length;
    let shape = {
      id: this.id(),
      type: "triangle",
      label: `Triangle ${idx + 1}`,
      opacity: new Array(this.config.video_count).fill(0.5),
      points: {
        input: JSON.parse(JSON.stringify(defaultTriangle)),
        output: JSON.parse(JSON.stringify(defaultTriangle)),
      },
    };

    shapes.push(shape);

    let column = document.createElement("div");
    column.className = "column shape";

    let shapeEl = new Shape(idx + 1, shapes[idx]);
    column.appendChild(shapeEl.el);

    document.querySelector(".slideout .table").appendChild(column);

    for (var j = 0; j < groups.length; j++) {
      let toggle = new GroupToggle(j, idx);
      column.appendChild(toggle.el, this.toggleGroup.bind(this));
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "update_state",
        state: this.state,
      }),
    );
  }

  updateVideo(idx, video, file) {
    if (!this.screen) {
      return;
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "reset_video",
        videoIdx: idx,
      }),
    );

    this.screen.postMessage(file);
  }

  updateEffect(effect, e) {
    if (!this.screen) {
      return;
    }

    let { shapes, groups, videos } = this.state;
    let { selectedVideos, selectedGroup, selectedEffect } = this;
    let { value } = e.target;

    let group = groups[selectedGroup];
    let ids = selectedGroup === 0 ? shapes.map((_, idx) => idx) : group.shapes;

    if (effect === "opacity") {
      for (var i = 0; i < selectedVideos.length; i++) {
        let videoIdx = selectedVideos[i];
        let opacity = group.opacity[videoIdx];
        let diff = value - opacity;

        for (var j = 0; j < ids.length; j++) {
          let shape = shapes[ids[j]];
          let oldValue = shape.opacity[videoIdx];
          let shapeDiff = +value - oldValue;
          let newValue = oldValue + diff + (shapeDiff - diff) * 0.25;

          console.log(ids[j], oldValue, newValue);

          shape.opacity[videoIdx] = newValue;
        }

        group.opacity[videoIdx] = opacity + diff;
      }
    } else {
      let diff = 0;
      for (var i = 0; i < selectedVideos.length; i++) {
        let video = videos[selectedVideos[i]];
        let effectIdx = effect === "effect_a" ? 0 : 1;
        let oldValue = video.values[selectedEffect][effectIdx];

        if (i === 0) {
          diff = +value - oldValue;
        }

        let newValue = Math.min(Math.max(oldValue + diff, 0), 1);

        console.log(video.values);
        video.values[selectedEffect][effectIdx] = newValue;
      }
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "update_state",
        state: this.state,
      }),
    );

    // let effectIdx = this.selectedEffect || 0;
    // let values = this.values[videoIdx][effectIdx];

    // values[effect] = value;
    // this.screen.postMessage(
    //   JSON.stringify({
    //     action: "update_effects",
    //     videoIdx: videoIdx,
    //     effectIdx: effectIdx,
    //     effect_a: values.effect_a,
    //     effect_b: values.effect_b,
    //     effect_c: values.effect_c,
    //   }),
    // );
  }

  toggleVideo(idx) {
    console.log(idx);
    this.selectedVideos[0] = idx;
    // console.log(idx);

    // if (this.selectedVideos.includes(idx)) {
    //   this.selectedVideos.splice(this.selectedVideos.indexOf(idx), 1);
    // } else {
    //   this.selectedVideos.push(idx);
    // }

    this.setValues();
  }

  toggleGroup(shapeIdx, groupIdx) {
    let group = this.state.groups[groupIdx];
    let existingIdx = group.shapes.indexOf(shapeIdx);

    if (existingIdx === -1) {
      group.shapes.push(shapeIdx);
    } else {
      group.shapes.splice(existingIdx, 1);
    }
  }

  selectEffect(idx) {
    this.selectedEffect = idx;
    this.setValues();

    document
      .querySelector(":root")
      .style.setProperty("--selected-fx-clr", `var(--fx-clr-${idx}`);
  }

  selectGroup(idx) {
    this.selectedGroup = idx;
    this.setValues();

    document
      .querySelector(":root")
      .style.setProperty("--selected-grp-clr", `var(--grp-clr-${idx}`);
  }

  selectShape(idx) {
    this.selectedShape = idx;
  }

  setEffect(idx, effect) {
    console.log(idx, effect, this.state.effects);
    this.state.effects[idx] = effect;
  }

  setValues() {
    let selectedVideo = this.selectedVideos[0];
    let selectedGroup = this.selectedGroup;
    let selectedEffect = this.selectedEffect;

    document.querySelectorAll(".inputs input")[0].value =
      this.state.groups[selectedGroup].opacity[selectedVideo];

    document.querySelectorAll(".inputs input")[1].value =
      this.state.videos[selectedVideo].values[selectedEffect][0];

    document.querySelectorAll(".inputs input")[2].value =
      this.state.videos[selectedVideo].values[selectedEffect][1];
  }

  // updateValues(valueIdx, videoIdx, e) {
  //   console.log(valueIdx, videoIdx, e.target.value);
  //   if (!this.screen) {
  //     return;
  //   }

  //   this.values[videoIdx][valueIdx] = e.target.value;

  //   this.screen.postMessage(
  //     JSON.stringify({
  //       action: "update_effects",
  //       videoIdx: videoIdx,
  //       effect_a: this.values[videoIdx][0],
  //       effect_b: this.values[videoIdx][1],
  //       effect_c: this.values[videoIdx][2],
  //     }),
  //   );
  // }
}

console.log(Config.default);

new App(Config.default);
