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
    [0, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 1],
    [0, 1],
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
      midiAccess: null,
      media: [],
      name: "My Project",
    });

    this.config = config;
    this.state = this.defaultState();

    this.flags = {
      lock_selected_video: false,
    };

    this.id = this.gen_id();
    this.name = "My Project";
    this.screen = null;

    this.midiAccess = null;
    this.midiInput = null;
    this.midiOutput = null;

    this.selectedMedia = null;
    this.stream = null;
    this.media = [];

    this.leds = null;
    this.sliders = null;
    this.midiWorker = null;

    this.setupMidi();
    this.setupMedia();

    this.launch();
  }

  saveState() {
    this.state = { ...this.state };

    if (!!this.midiOutput) {
      this.leds.updateState(this.state);
      this.sliders.updateState(this.state);
    }
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
            {
              input: [
                [0, 0],
                [1, 1],
                [0, 1],
              ],
              output: [
                [0, 0],
                [1, 1],
                [0, 1],
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
      console.log("Midi Success");

      for (const entry of midiAccess.inputs) {
        console.log(entry[1]);
        if (entry[1].name === "Sensory Controller") {
          this.midiInput = entry[1];
          console.log(this.midiInput);
          entry[1].onmidimessage = (e) => {
            let note = e.data[1];
            let velocity = e.data[2];

            console.log(note, velocity);

            let { midi } = this.config;

            let opacityNotes = midi.buttons.opacity;
            for (var i = 0; i < opacityNotes.length; i++) {
              if (+note === +opacityNotes[i]) {
                // this.sliders.pauseIn();
                this.updateOpacity(i, velocity / 127);
              }
            }

            let layerNotes = midi.buttons.select;
            for (var i = 0; i < layerNotes.length; i++) {
              if (+note === +layerNotes[i] && velocity === 64) {
                this.sliders.pauseIn();
                this.updateSelected("video", i);
              }
            }

            let effectSelectNote = midi.selectors.select[0];
            if (+note === +effectSelectNote) {
              let current = this.state.selected.effect ?? 0;

              this.sliders.pauseIn();
              if (velocity === 127) {
                let next = current - 1 < 0 ? 5 : current - 1;
                this.updateSelected("effect", next);
              } else {
                let next = (current + 1) % 6;
                this.updateSelected("effect", next);
              }
            }

            let scriptSelectNote = midi.selectors.select[1];
            if (+note === +scriptSelectNote) {
              let current = this.state.selected.script ?? 0;

              this.sliders.pauseIn();
              if (velocity === 127) {
                let next = current - 1 < 0 ? 5 : current - 1;
                this.updateSelected("script", next);
              } else {
                let next = (current + 1) % 6;
                this.updateSelected("script", next);
              }
            }

            if (!this.sliders.input_paused) {
              let sliderNotes = midi.sliders[0];
              for (var i = 0; i < sliderNotes.length; i++) {
                if (+note === +sliderNotes[i]) {
                  let { effect, script } = this.state.selected;

                  this.sliders.pauseOut();
                  if (effect !== null) {
                    this.updateEffectValue(i, velocity / 127);
                  }

                  if (script !== null) {
                    this.updateScriptValue(i, velocity / 127);
                  }
                }
              }
            }
          };
        }
      }

      for (const entry of midiAccess.outputs) {
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

      this.midiAccess = midiAccess; // store in the global (in real usage, would probably keep in an object instance)

      // this.midiWorker = new Worker(new URL("./midi.js", import.meta.url));
      // this.midiWorker.onmessage = (e) => {
      //   console.log(e.data);
      // };
      // this.midiWorker.postMessage({
      //   action: "config",
      //   message: {
      //     configuration: this.config,
      //     input: this.midiInput,
      //     output: this.midiOutput,
      //   },
      // });
    };

    const onMIDIFailure = (msg) => {
      console.error(`Failed to get MIDI access - ${msg}`);
    };

    if (!!navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else {
      console.log("No Midi Access");
    }
  }

  async toggleMedia(device) {
    try {
      this.selectedMedia = device;
      // this.stream = await navigator.mediaDevices.getUserMedia({
      //   audio: false,
      //   video: { deviceId: device.deviceId },
      // });

      // console.log(this.stream);
    } catch (err) {
      console.log("Failed to load webcam:", err);
    }
  }

  async setupMedia() {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.media = [...devices].filter((d) => {
        return d.kind === "videoinput";
      });
    });
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
        // console.log(err);
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
      "effect_x",
      "effect_y",
      "previous_value",
      ScriptTemplate(code),
    )(stateClone, 0, 0, undefined);

    script.label = label;
    script.code = code;

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

  removeScript(id) {
    for (var i = 0; i < this.state.scripts.length; i++) {
      if (this.state.scripts[i] === id) {
        this.setScript(i, null);
      }
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "remove_script",
        script_id: id,
      }),
    );

    this.scripts = this.scripts.filter((s) => s.id !== id);
    localStorage.setItem("scripts", JSON.stringify(this.scripts));
  }

  downloadScripts() {
    let { scripts } = this;

    scripts.map((s) => {
      if (!s.id) {
        s.id = this.gen_id();
      }
    });

    let dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(scripts, null, 2));

    let a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("class", "hidden");
    a.setAttribute("download", "sensory_control_scripts.json");

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  uploadScripts(e) {
    let { scripts } = this;

    if (e.target.files.length > 0) {
      let file = e.target.files[0];
      let reader = new FileReader();
      let self = this;

      reader.onload = function () {
        let loaded = JSON.parse(reader.result);

        (loaded || []).map((script) => {
          let existingIdx = scripts.findIndex((p) => p.id === script.id);

          if (existingIdx === -1) {
            scripts.push(script);

            self.screen.postMessage(
              JSON.stringify({
                action: "update_script",
                script_id: script.id,
              }),
            );
          } else {
            // TODO: Implement
            console.log("Script already exists, confirm overwrite");
          }
        });

        localStorage.setItem("scripts", JSON.stringify(scripts));
        self.scripts = [...scripts];
      };

      reader.readAsText(file);
    }
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

  updateVideoMedia(idx, source) {
    if (!this.screen) {
      return;
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "set_media",
        deviceId: source.deviceId,
        deviceName: source.label,
        videoIdx: idx,
      }),
    );
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

    if (!this.flags.lock_selected_video) {
      this.state.selected.video = idx;
    }

    clearTimeout(this.flags.lock_selected_video);
    this.flags.lock_selected_video = setTimeout(() => {
      this.flags.lock_selected_video = clearTimeout(
        this.flags.lock_selected_video,
      );
    }, 300);

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
