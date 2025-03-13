import { Config } from "./lib/Config";
import { Effects } from "./lib/Effects";
import { Storage } from "./lib/Storage";
import { ScriptTemplate } from "./lib/ScriptTemplate";
import { LEDs } from "./lib/LEDs";
import { Sliders } from "./lib/Sliders";

const defaultTriangle = [
  [0.4, 0.4],
  [0.6, 0.4],
  [0.5, 0.6],
];

const defaultQuad = [
  [
    [0.35, 0.35],
    [0.65, 0.35],
    [0.65, 0.65],
  ],
  [
    [0.35, 0.35],
    [0.65, 0.65],
    [0.35, 0.65],
  ],
];

// const defaultQuad =

class App extends Context {
  constructor(config) {
    super({
      effects: Effects,
      scripts: JSON.parse(localStorage.getItem("scripts")) || [],
      state: null,
      id: null,
      name: "My Project",
    });

    // this.context = context;
    this.config = config;
    this.state = this.defaultState();

    // this.effects = Effects;
    // this.scripts = [];

    this.id = this.gen_id();
    this.name = "My Project";
    this.screen = null;

    // this.selectedVideos = [0];
    // this.selectedGroup = 0;
    // this.selectedEffect = 0;

    // this.selectedShape = null;
    // this.selectedVertex = null;

    this.midiAccess = null;
    this.midiInput = null;
    this.midiOutput = null;

    this.leds = null;
    this.sliders = null;
    this.setupMidi();
    // this.setValues();

    this.launch();
  }

  saveState() {
    this.state = { ...this.state };
    this.leds.updateState(this.state);
    this.sliders.updateState(this.state);
  }

  gen_id() {
    return (Math.random() * 1000000) | 0;
  }

  defaultUI() {
    return {
      launched: false,
    };
  }

  defaultState() {
    let { config } = this;

    return {
      selected: {
        video: null,
        effect: null,
        script: null,
      },
      videos: new Array(config.video_count).fill().map((_, idx) => {
        return {
          id: this.gen_id(),
          label: `Video ${idx + 1}`,
          opacity: 0,
        };
      }),

      values: {
        effects: new Array(config.video_count).fill().map(() => {
          return new Array(config.effect_count).fill().map(() => {
            return new Array(config.effect_parameter_count).fill(0);
          });
        }),
        scripts: new Array(config.effect_count).fill().map(() => {
          return new Array(config.effect_parameter_count).fill(0);
        }),
      },

      scripts: new Array(config.script_count).fill().map((_, idx) => {
        return null;
      }),

      effects: new Array(config.effect_count).fill().map((_, idx) => {
        return null;
      }),

      shapes: [
        {
          id: this.gen_id(),
          type: "quad",
          label: "Quad 1",
          opacity: new Array(config.video_count).fill(0),
          tris: [
            {
              input: [
                [0.05, 0.05],
                [0.95, 0.05],
                [0.95, 0.95],
              ],
              output: [
                [0.05, 0.05],
                [0.95, 0.05],
                [0.95, 0.95],
              ],
            },
            {
              input: [
                [0.05, 0.05],
                [0.95, 0.95],
                [0.05, 0.95],
              ],
              output: [
                [0.05, 0.05],
                [0.95, 0.95],
                [0.05, 0.95],
              ],
            },
          ],
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
          43: 0,
          44: 1,
        },
        sliders: {
          input: {
            56: 2,
            54: 1,
            55: 0,
          },
          output: {
            45: 0,
            46: 1,
            47: 2,
          },
        },
      },
    };
  }

  setupMidi() {
    let { buttons, sliders, knobs } = this.state.notes;

    const onMIDISuccess = (midiAccess) => {
      this.midiAccess = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
      for (const entry of this.midiAccess.inputs) {
        console.log(entry[1]);
        if (entry[1].name === "Sensory Controller") {
          this.midiInput = entry[1];

          entry[1].onmidimessage = (e) => {
            let note = e.data[1];
            let velocity = e.data[2];

            console.log(note, velocity);
          };
        }

        if (entry[1].name === "Arduino Micro") {
          console.log("MIDI DEVICE FOUND");

          this.midiInput = entry[1];

          entry[1].onmidimessage = (e) => {
            let note = e.data[1];
            let velocity = e.data[2];

            console.log(note, velocity);

            return;

            let { shapes, groups, videos } = this.state;
            let { selectedVideos, selectedGroup, selectedEffect } = this;

            let group = groups[selectedGroup];
            let ids =
              selectedGroup === 0 ? shapes.map((_, idx) => idx) : group.shapes;

            if (buttons.hasOwnProperty(note)) {
              let idx = buttons[note];

              let inputs = document.querySelectorAll("#videos .video");
              let input = inputs[idx].querySelector("input[type='radio']");

              input.checked = true;
              input.dispatchEvent(new Event("change", { bubbles: true }));
            } else if (knobs.hasOwnProperty(note)) {
              if (note === 43) {
                if (velocity === 0) {
                  // this.selectedEffect = Math.max(0, selectedEffect - 1);
                  if (selectedEffect === 0) {
                    this.selectedEffect = 5;
                  } else {
                    this.selectedEffect -= 1;
                  }
                } else {
                  // this.selectedEffect = Math.min(5, selectedEffect + 1);
                  if (selectedEffect === 5) {
                    this.selectedEffect = 0;
                  } else {
                    this.selectedEffect += 1;
                  }
                }

                let prevEffect = document.querySelector(".select.selected");
                if (!!prevEffect) {
                  prevEffect.classList.remove("selected");
                }

                let currentEffect = document
                  .querySelectorAll(".select")
                  [this.selectedEffect].classList.add("selected");
              } else if (note === 44) {
                if (velocity === 0) {
                  this.selectedGroup = Math.max(0, selectedGroup - 1);
                  // if (selectedGroup === 0) {
                  //   this.selectedGroup = 5;
                  // } else {
                  //   this.selectedGroup -= 1;
                  // }
                } else {
                  this.selectedGroup = Math.min(5, selectedGroup + 1);
                  // if (selectedGroup === 5) {
                  //   this.selectedGroup = 0;
                  // } else {
                  //   this.selectedGroup += 1;
                  // }
                }

                let prevGroup = document.querySelector(".group .selected");
                if (!!prevGroup) {
                  prevGroup.classList.remove("selected");
                }

                let currentGroup = document
                  .querySelectorAll(".group .group-btn")
                  [this.selectedGroup].classList.add("selected");
              }

              this.screen.postMessage(
                JSON.stringify({
                  action: "update_state",
                  state: this.state,
                }),
              );

              this.saveState();
              this.setLEDS();
            } else if (sliders.input.hasOwnProperty(note)) {
              let idx = sliders.input[note];
              let inputs = document.querySelectorAll(
                ".inputs input[type='range']",
              );

              console.log("velocity", note, velocity);
              let value = velocity / 127;
              if (idx === 0) {
                for (var i = 0; i < selectedVideos.length; i++) {
                  let videoIdx = selectedVideos[i];
                  let opacity = group.opacity[videoIdx];
                  let diff = value - opacity;

                  for (var j = 0; j < ids.length; j++) {
                    let shape = shapes[ids[j]];
                    let oldValue = shape.opacity[videoIdx];
                    let shapeDiff = +value - oldValue;
                    let newValue = oldValue + diff + (shapeDiff - diff) * 0.25;

                    shape.opacity[videoIdx] = newValue;
                  }

                  group.opacity[videoIdx] = opacity + diff;

                  let input = inputs[idx];
                  input.value = value;
                }

                this.setLEDS();
              } else {
                let diff = 0;
                for (var i = 0; i < selectedVideos.length; i++) {
                  let video = videos[selectedVideos[i]];
                  let effectIdx = idx === 1 ? 0 : 1;
                  let oldValue = video.values[selectedEffect][effectIdx];
                  if (i === 0) {
                    diff = +value - oldValue;
                  }

                  let newValue = Math.min(Math.max(oldValue + diff, 0), 1);
                  video.values[selectedEffect][effectIdx] = newValue;

                  let input = inputs[idx];
                  input.value = value;
                }
              }

              this.screen.postMessage(
                JSON.stringify({
                  action: "update_state",
                  state: this.state,
                }),
              );

              this.saveState();

              // let input = inputs[idx];
              // input.value = velocity / 127;
              // input.dispatchEvent(new Event("input", { bubbles: true }));
            }
          };
        }
      }

      for (const entry of this.midiAccess.outputs) {
        if (entry[1].name === "Arduino Micro") {
          this.midiOutput = entry[1];
        }

        if (entry[1].name === "Sensory Controller") {
          this.midiOutput = entry[1];
        }
      }

      this.leds = new LEDs(
        this.state,
        this.config,
        this.midiOutput,
        this.midiInput,
      );

      this.sliders = new Sliders(
        this.state,
        this.config,
        this.midiOutput,
        this.midiInput,
      );
    };
    const onMIDIFailure = (msg) => {
      console.error(`Failed to get MIDI access - ${msg}`);
    };
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }

  launch() {
    if (!!this.screen) {
      return;
    }

    window.addEventListener("message", (e) => {
      try {
        let data = JSON.parse(e.data);
        if (data.action === "update_state") {
          this.state = data.state;
          this.saveState();
        } else if (data.action === "select_shape") {
          this.selectedShape = data.shape;
          this.selectedVertex = data.vertex;

          // TODO get selected shape and call el.controller.setSelected
        }
      } catch (err) {
        console.log(err);
      }
    });
  }

  popout() {
    this.screen = window.open("./rescreen.html");
    // document.querySelector(".launch-overlay").style.display = "none";

    this.screen.addEventListener("load", () => {
      this.screen.postMessage(
        JSON.stringify({
          action: "update_state",
          state: this.state,
        }),
      );
    });
  }

  updateProjectName(e) {
    this.name = e.target.value;
  }

  updateSelected(type, idx) {
    this.state.selected[type] = idx;

    if (type === "script") {
      this.state.selected["effect"] = null;
    }

    if (type === "effect") {
      this.state.selected["script"] = null;
    }

    this.saveState();
  }

  getSelectedValues() {
    let { selected } = this.state;
    let { effect, script, video } = selected;

    if (script === null) {
      if (effect !== null) {
        if (video === null) {
          return [0, 0];
        }

        return this.state.values.effects[video][effect];
      }
    }

    if (effect === null) {
      if (script !== null) {
        return this.state.values.scripts[script];
      }
    }

    return [0, 0];
  }

  addScript(type) {
    this.scripts = [
      ...this.scripts,
      {
        id: this.gen_id(),
        label: `Script ${this.scripts.length + 1}`,
        code: "",
      },
    ];
  }

  updateScript(id, label, code) {
    let script = this.scripts.find((s) => s.id === id);

    let stateClone = JSON.parse(JSON.stringify(this.state));
    let validation = new Function(
      "state",
      "effect_a",
      "effect_b",
      "previous_value",
      ScriptTemplate(code),
    )(stateClone, 0, 0, undefined);

    script.label = label;
    script.code = code;

    // this.state.scripts
    //   .reduce((a, c, i) => {
    //     if (c !== null) {
    //       return a.concat(c.id === id ? i : []);
    //     } else {
    //       return a;
    //     }
    //   }, [])
    //   .map((idx) => {
    //     this.state.script[idx] = script;
    //   });

    this.scripts = [...this.scripts];
    localStorage.setItem("scripts", JSON.stringify(this.scripts));

    this.screen.postMessage(
      JSON.stringify({
        action: "update_script",
        script_id: id,
      }),
    );

    this.saveState();
  }

  addShape(type) {
    if (!this.screen) {
      return;
    }

    let { shapes, groups } = this.state;

    let idx = shapes.filter((s) => s.type === type).length;
    if (type === "triangle") {
      let shape = {
        id: this.gen_id(),
        type: "triangle",
        label: `Triangle ${idx + 1}`,
        opacity: new Array(this.config.video_count).fill(0),
        tris: [
          {
            input: JSON.parse(JSON.stringify(defaultTriangle)),
            output: JSON.parse(JSON.stringify(defaultTriangle)),
          },
        ],
      };

      shapes.push(shape);
    } else if (type === "quad") {
      let shape = {
        id: this.gen_id(),
        type: "quad",
        label: `Quad ${idx + 1}`,
        opacity: new Array(this.config.video_count).fill(0),
        tris: [
          {
            input: JSON.parse(JSON.stringify(defaultQuad[0])),
            output: JSON.parse(JSON.stringify(defaultQuad[0])),
          },
          {
            input: JSON.parse(JSON.stringify(defaultQuad[1])),
            output: JSON.parse(JSON.stringify(defaultQuad[1])),
          },
        ],
      };

      shapes.push(shape);
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "update_state",
        state: this.state,
      }),
    );

    this.saveState();
  }

  removeShape(shape) {
    let { shapes } = this.state;
    let idx = shapes.findIndex((s) => s === shape);

    if (idx === -1) {
      console.log("Couldn't find shape to remove:", shapes, shape);
    }

    shapes.splice(idx, 1);

    this.screen.postMessage(
      JSON.stringify({
        action: "update_state",
        state: this.state,
      }),
    );

    this.saveState();
  }

  updateShape(idx, name) {
    // Stub
  }

  selectShape(idx) {
    // Stub
  }

  updateVideo(idx, file) {
    if (!this.screen) {
      return;
    }

    if (file === null) {
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

  updateOpacity(idx, value) {
    if (!this.screen) {
      return;
    }

    let { shapes, videos } = this.state;

    let opacity = videos[idx].opacity;
    let diff = value - opacity;

    for (let i = 0; i < shapes.length; i++) {
      let shape = shapes[i];
      let oldValue = shape.opacity[idx];
      let shapeDiff = +value - oldValue;
      let newValue = oldValue + diff + (shapeDiff - diff) * 0.25;

      shape.opacity[idx] = newValue;
    }

    videos[idx].opacity = opacity + diff;

    // if (!!this.midiOutput) {
    //   this.midiOutput.send([
    //     144,
    //     notes[0],
    //     (group.opacity[videoIdx] * 127) | 0,
    //   ]);
    // }

    this.screen.postMessage(
      JSON.stringify({
        action: "update_state",
        state: this.state,
      }),
    );

    this.saveState();
  }

  updateValue(idx, value) {
    let { selected } = this.state;
    let { effect, script, video } = selected;

    if (script === null) {
      if (effect !== null) {
        this.updateEffectValue(idx, value);
      }
    }

    if (effect === null) {
      if (script !== null) {
        this.updateScriptValue(idx, value);
      }
    }
  }

  updateScriptValue(valueIdx, value) {
    let { selected } = this.state;
    let { effect, script, video } = selected;

    this.state.values.scripts[script][valueIdx] = value;
    this.screen.postMessage(
      JSON.stringify({
        action: "update_state",
        state: this.state,
      }),
    );

    this.saveState();
  }

  updateEffectValue(effectIdx, value) {
    if (!this.screen) {
      return;
    }

    let { state } = this;
    let { video, effect } = state.selected;

    if (video === null || effect === null) {
      return;
    }

    this.state.values.effects[video][effect][effectIdx] = value;

    this.screen.postMessage(
      JSON.stringify({
        action: "update_state",
        state: this.state,
      }),
    );

    this.saveState();
  }

  toggleVideo(idx) {
    this.selectedVideos[0] = idx;
    this.setValues();
  }

  removeVideo(idx) {
    this.state.values.effects[idx] = new Array(6).fill().map((a) => {
      return new Array(this.config.effect_parameter_count).fill(0);
    });

    this.screen.postMessage(
      JSON.stringify({
        action: "remove_video",
        videoIdx: idx,
        state: this.state,
      }),
    );

    this.saveState();
    this.setValues();
  }

  // toggleGroup(shapeIdx, groupIdx) {
  //   let group = this.state.groups[groupIdx];
  //   let existingIdx = group.shapes.indexOf(shapeIdx);

  //   if (existingIdx === -1) {
  //     group.shapes.push(shapeIdx);
  //   } else {
  //     group.shapes.splice(existingIdx, 1);
  //   }
  // }

  // selectEffect(idx) {
  //   this.selectedEffect = idx;
  //   this.setValues();

  //   document
  //     .querySelector(":root")
  //     .style.setProperty("--selected-fx-clr", `var(--fx-clr-${idx}`);
  // }

  // selectGroup(idx) {
  //   this.selectedGroup = idx;
  //   this.setValues();

  //   document
  //     .querySelector(":root")
  //     .style.setProperty("--selected-grp-clr", `var(--grp-clr-${idx}`);
  // }

  // selectShape(idx) {
  //   this.selectedShape = idx;
  // }

  setEffect(idx, effect) {
    let { state } = this;

    state.effects[idx] = effect;

    console.log(state.values);

    let fx = this.effects.find((e) => e.id === effect);
    if (!!fx) {
      for (var i = 0; i < state.videos.length; i++) {
        state.values.effects[i][idx] = [...fx.defaults];
      }
    } else {
      console.log("Unknown Effect", effect);
    }

    this.state = { ...state, effects: [...state.effects] };

    this.screen.postMessage(
      JSON.stringify({
        action: "set_effect",
        effectIdx: idx,
        effect: effect,
        state: state,
      }),
    );

    this.saveState();
    this.setValues();
  }

  setScript(idx, script_id) {
    this.state.scripts[idx] = script_id;
    this.state = { ...this.state, scripts: [...this.state.scripts] };

    this.screen.postMessage(
      JSON.stringify({
        action: "update_state",
        state: this.state,
      }),
    );

    this.saveState();
    // this.setValues();
  }

  setValues() {
    // let selectedVideo = this.selectedVideos[0];
    // let selectedGroup = this.selectedGroup;
    // let selectedEffect = this.selectedEffect;

    // let opacity = this.state.groups[selectedGroup].opacity[selectedVideo];
    // let effect_a = this.state.videos[selectedVideo].values[selectedEffect][0];
    // let effect_b = this.state.videos[selectedVideo].values[selectedEffect][1];

    // document.querySelectorAll(".inputs input")[0].value = opacity;
    // document.querySelectorAll(".inputs input")[1].value = effect_a;
    // document.querySelectorAll(".inputs input")[2].value = effect_b;

    this.setMidi();
    this.setLEDS();
  }

  setEffectValues() {
    // let effects = this.state.effects;
    // let effectEls = document.querySelectorAll("#effects > .select");
    // for (var i = 0; i < effects.length; i++) {
    //   let effect = effects[i];
    //   let el = effectEls[i];
    //   el.controller.setSelected(effect);
    // }
  }

  setMidi() {
    // // stub
    // return;
    // let selectedVideo = this.selectedVideos[0];
    // let selectedGroup = this.selectedGroup;
    // let selectedEffect = this.selectedEffect;
    // let opacity = this.state.groups[selectedGroup].opacity[selectedVideo];
    // let effect_a = this.state.videos[selectedVideo].values[selectedEffect][0];
    // let effect_b = this.state.videos[selectedVideo].values[selectedEffect][1];
    // let { sliders } = this.state.notes;
    // let notes = Object.keys(sliders.output);
    // if (!!this.midiOutput) {
    //   this.midiOutput.send([144, notes[0], (opacity * 127) | 0]);
    //   this.midiOutput.send([144, notes[1], (effect_a * 127) | 0]);
    //   this.midiOutput.send([144, notes[2], (effect_b * 127) | 0]);
    // }
  }

  setLEDS() {
    // // stub
    // return;
    // if (!this.midiOutput) {
    //   return;
    // }
    // let selectedVideo = this.selectedVideos[0];
    // let selectedGroup = this.selectedGroup;
    // let selectedEffect = this.selectedEffect;
    // let opacity = this.state.groups[selectedGroup].opacity[selectedVideo];
    // let opacityNote = [10, 11, 12, 13, 14, 15][selectedVideo];
    // this.midiOutput.send([144, opacityNote, (opacity * 100) | 0]);
    // let groupNotes = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
    // let effectNotes = [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
    // for (var i = 0; i < 6; i++) {
    //   let note1 = groupNotes[i * 2];
    //   let note2 = groupNotes[i * 2 + 1];
    //   let groupOpacity = this.state.groups[i].opacity[selectedVideo];
    //   if (selectedGroup !== i) {
    //     this.midiOutput.send([144, note1, (groupOpacity * 10) | 0]);
    //     this.midiOutput.send([144, note2, (groupOpacity * 10) | 0]);
    //   } else {
    //     this.midiOutput.send([144, note1, 127]);
    //     this.midiOutput.send([144, note2, 127]);
    //   }
    // }
    // for (var i = 0; i < 6; i++) {
    //   let note1 = effectNotes[i * 2];
    //   let note2 = effectNotes[i * 2 + 1];
    //   let values = this.state.videos[selectedVideo].values[i];
    //   if (selectedEffect !== i) {
    //     this.midiOutput.send([144, note1, (values[0] * 10) | 0]);
    //     this.midiOutput.send([144, note2, (values[1] * 10) | 0]);
    //   } else {
    //     console.log(note1, note2);
    //     this.midiOutput.send([144, note1, 127]);
    //     this.midiOutput.send([144, note2, 127]);
    //   }
    // }
    // let effectNotes = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
    // let groupNotes = [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
    // for (var i = 0; i < 6; i++) {
    //   let note1 = groupNotes[i * 2];
    //   let note2 = groupNotes[i * 2 + 1];
    //   let groupOpacity = this.state.groups[i].opacity[selectedVideo];
    //   if (selectedGroup !== i) {
    //     this.midiOutput.send(144, note1, (groupOpacity * 10) | 0);
    //     this.midiOutput.send(144, note2, (groupOpacity * 10) | 0);
    //   } else {
    //     this.midiOutput.send(144, note1, 0);
    //     this.midiOutput.send(144, note2, 0);
    //   }
    // }
    // console.log(selectedEffect);
    // console.log(selectedGroup);
    // for (var i = 0; i < 6; i++) {
    //   let note1 = effectNotes[i * 2];
    //   let note2 = effectNotes[i * 2 + 1];
    //   let values = this.state.videos[selectedVideo].values[i];
    //   if (selectedEffect !== i) {
    //     this.midiOutput.send(144, note1, (values[0] * 10) | 0);
    //     this.midiOutput.send(144, note2, (values[1] * 10) | 0);
    //   } else {
    //     this.midiOutput.send(144, note1, 255);
    //     this.midiOutput.send(144, note2, 255);
    //   }
    // }
  }

  debounce(callback, wait) {
    window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => {
      callback();
    }, wait);
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

window.addEventListener("load", () => {
  // const context = new Context({
  //   config: { ...Config.default },
  //   state: {},
  //   storage: {},
  // });

  const config = { ...Config.default };

  const app = new App(config);
  const appEl = document.querySelector("sensory-controls");

  const storage = new Storage(app);

  appEl.storage = storage;

  appEl.app = app;
});
