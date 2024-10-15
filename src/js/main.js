import { Config } from "./libs/config.js";
import { Video } from "./libs/videos.js";
import { Effect } from "./libs/effects.js";
import { Shapes, Triangle, Group } from "./libs/shapes.js";

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

    this.triangles = [];
    this.values = [];
    this.videos = [];
    this.groups = [];
    this.effects = [];

    this.selectedVideos = [];
    this.selectedGroup = null;
    this.selectedEffect = null;

    this.midiAccess = null;
    this.midiInput = null;
    this.midiOutput = null;

    this.setupVideos();
    this.setupGroups();
    this.setupEffects();
    this.setupMidi();
    this.setupValues();

    this.launch();
  }

  setupMidi() {
    //   const onMIDISuccess = (midiAccess) => {
    //     this.midiAccess = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
    //     for (const entry of this.midiAccess.inputs) {
    //       if (entry[1].id === "-1994529889") {
    //         this.midiInput = entry[1];
    //         entry[1].onmidimessage = (e) => {
    //           let note = e.data[1];
    //           let velocity = e.data[2];
    //           console.log(note);
    //           if (note === 48) {
    //             this.selectedVideo = 0;
    //           } else if (note === 53) {
    //             this.selectedVideo = 1;
    //           } else if (note === 50) {
    //             this.selectedVideo = 2;
    //           } else if (note === 51) {
    //             this.selectedVideo = 3;
    //           } else if (note === 49) {
    //             this.selectedVideo = 4;
    //           } else if (note === 52) {
    //             this.selectedVideo = 5;
    //           } else if (note === 56) {
    //             let input = document
    //               .querySelectorAll("#videos > div")
    //               [this.selectedVideo].querySelectorAll("input")[0];
    //             input.value = velocity / 127;
    //             input.dispatchEvent(new Event("input", { bubbles: true }));
    //           } else if (note === 54) {
    //             let input = document
    //               .querySelectorAll("#videos > div")
    //               [this.selectedVideo].querySelectorAll("input")[1];
    //             input.value = velocity / 127;
    //             input.dispatchEvent(new Event("input", { bubbles: true }));
    //           } else if (note === 55) {
    //             let input = document
    //               .querySelectorAll("#videos > div")
    //               [this.selectedVideo].querySelectorAll("input")[2];
    //             input.value = velocity / 127;
    //             input.dispatchEvent(new Event("input", { bubbles: true }));
    //           }
    //         };
    //       }
    //       // if (entry[1].id === "325563316") {
    //       //   this.midiInput = entry[1];
    //       //   entry[1].onmidimessage = (e) => {
    //       //     console.log("APK", e);
    //       //   };
    //       // }
    //     }
    //     // for (const entry of this.midiAccess.outputs) {
    //     //   if (entry[1].id === "-173082528") {
    //     //     this.midiOutput = entry[1];
    //     //     this.midiOutput.send([0x90, 0x00, 0x03]);
    //     //   }
    //     // }
    //   };
    //   const onMIDIFailure = (msg) => {
    //     console.error(`Failed to get MIDI access - ${msg}`);
    //   };
    //   navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }

  setupValues() {
    let vidCnt = this.config.video_count;
    let fxCnt = this.config.effect_count;

    for (var i = 0; i < vidCnt; i++) {
      let vidEffects = [];

      for (var j = 0; j < fxCnt; j++) {
        vidEffects.push({
          effect_a: 0,
          effect_b: 0,
          effect_c: 0,
        });
      }

      this.values.push(vidEffects);
    }
  }

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
      .addEventListener("click", this.addTriangle.bind(this));
  }

  popout() {
    this.screen = window.open("./screen.html");
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

    window.requestAnimationFrame(this.rotateColors.bind(this));
  }

  setupVideos() {
    let { updateVideo, updateEffect } = this;

    for (var i = 0; i < this.config.video_count; i++) {
      let video = new Video(i, updateVideo.bind(this), updateEffect.bind(this));
      this.videos.push(video);
      document.querySelector("#videos").appendChild(video.el);
    }
  }

  setupEffects() {
    for (var i = 0; i < this.config.effect_count; i++) {
      let effect = new Effect(i);
      this.effects.push(effect);
      document.querySelector("#effects").appendChild(effect.el);
    }
  }

  setupGroups() {
    for (var i = 0; i < this.config.group_count; i++) {
      let shapes = new Shapes(i);
      document.querySelector("#shapes thead tr").appendChild(shapes.el);

      let g = { triangles: [], values: [] };
      for (var j = 0; j < this.config.effect_count; j++) {
        g.values.push({ effect_a: 0, effect_b: 0, effect_c: 0 });
      }
      this.groups.push(g);
    }

    for (var i = 0; i < this.triangles.length; i++) {
      let shape = new Triangle(i);

      let row = document.createElement("tr");
      let body = document.querySelector("#shapes tbody");

      row.className = "triangle-row";
      body.appendChild(row);
      row.appendChild(shape.el);

      for (var j = 0; j < this.config.group_count; j++) {
        let group = new Group(i, j);
        this.groups.push(group);
        row.appendChild(group.el);
      }
    }
  }

  addTriangle() {
    if (!this.screen) {
      return;
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "add_triangle",
        triangle: defaultTriangle,
      }),
    );

    let idx = this.triangles.length;
    this.triangles.push(JSON.parse(JSON.stringify(defaultTriangle)));

    let shape = new Triangle(idx);
    let row = document.createElement("tr");
    let body = document.querySelector("#shapes tbody");
    let last = [...body.querySelectorAll("tr")].pop();

    body.insertBefore(row, last);
    row.appendChild(shape.el);

    for (var j = 0; j < this.config.group_count; j++) {
      let group = new Group(idx, j);
      row.appendChild(group.el);
    }
  }

  updateVideo(videoIdx, file) {
    if (!this.screen) {
      return;
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "reset_video",
        videoIdx: videoIdx,
      }),
    );

    console.log(file);

    this.screen.postMessage(file);
  }

  updateEffect(videoIdx, effect, value) {
    if (!this.screen) {
      return;
    }

    let effectIdx = this.selectedEffect || 0;
    let values = this.values[videoIdx][effectIdx];

    values[effect] = value;
    this.screen.postMessage(
      JSON.stringify({
        action: "update_effects",
        videoIdx: videoIdx,
        effectIdx: effectIdx,
        effect_a: values.effect_a,
        effect_b: values.effect_b,
        effect_c: values.effect_c,
      }),
    );
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
