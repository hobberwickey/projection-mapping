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
        slot: null,
      },
      videos: new Array(config.video_count).fill().map((_, idx) => {
        return {
          id: this.gen_id(),
          label: `Video ${idx + 1}`,
          opacity: 0,
        };
      }),
      slots: new Array(config.slot_count).fill().map((_, idx) => {
        return {
          label: `Empty`,
          script: {
            label: `Script ${idx + 1}`,
            code: "",
            values: [0, 0],
          },
          effect: null,
          disabled: false,
          values: new Array(6).fill().map((v) => {
            return [0, 0];
          }),
        };
      }),

      scripts: [],
      effects: [],

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
        if (entry[1].name === "Sensory Controller") {
          this.midiInput = entry[1];
          entry[1].onmidimessage = (e) => {
            let note = e.data[1];
            let velocity = e.data[2];

            // console.log(note, velocity);

            let { midi } = this.config;

            let opacityNotes = midi.buttons.opacity;
            for (var i = 0; i < opacityNotes.length; i++) {
              if (+note === +opacityNotes[i]) {
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
              let current =
                Math.min(Math.max(5, this.state.selected.slot ?? 6), 11) - 6;

              this.sliders.pauseIn();
              if (velocity === 127) {
                let next = current - 1 < 0 ? 5 : current - 1;
                this.updateSelected("slot", next + 6);
              } else {
                let next = (current + 1) % 6;
                this.updateSelected("slot", next + 6);
              }
            }

            let scriptSelectNote = midi.selectors.select[1];
            if (+note === +scriptSelectNote) {
              let current = Math.max(
                0,
                Math.min(5, this.state.selected.slot ?? 0),
              );

              this.sliders.pauseIn();
              if (velocity === 127) {
                let next = current - 1 < 0 ? 5 : current - 1;
                this.updateSelected("slot", next);
              } else {
                let next = (current + 1) % 6;
                this.updateSelected("slot", next);
              }
            }

            if (!this.sliders.input_paused) {
              let sliderNotes = midi.sliders[0];
              for (var i = 0; i < sliderNotes.length; i++) {
                if (+note === +sliderNotes[i]) {
                  this.sliders.pauseOut();
                  this.updateValue(i, velocity / 127);
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

    localStorage.setItem("scripts", JSON.stringify(this.scripts));
    this.screen.addEventListener("load", () => {
      this.screen.postMessage(
        JSON.stringify({
          action: "update_state",
          state: this.state,
        }),
      );

      // for (var i = 0; i < 6; i++) {
      //   this.screen.postMessage(
      //     JSON.stringify({
      //       action: "update_script",
      //       script_id: i,
      //     }),
      //   );
      // }
    });
  }

  updateProjectName(e) {
    this.name = e.target.value;
  }

  updateSelected(type, idx) {
    this.state.selected[type] = idx;
    this.saveState();
  }

  toggleDisabled(idx) {
    this.state.slots[idx].active = !this.state.slots[idx].active;

    this.screen.postMessage(
      JSON.stringify({
        action: "update_state",
        state: this.state,
      }),
    );

    this.saveState();
  }

  getSelectedValues() {
    let { selected } = this.state;
    let { slot, video } = selected;

    if (slot === null || video === null) {
      return [0, 0];
    }

    console.log(slot, this.state);
    if (this.state.slots[slot].effect === "__script") {
      return this.state.slots[slot].script.values;
    }

    return this.state.slots[slot].values[video];
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
      "script_id",
      "registry",
      ScriptTemplate(code),
    )(stateClone, 0, 0, id, { elapsed: 1 });

    script.label = label;
    script.code = code;

    this.scripts = [...this.scripts];
    localStorage.setItem("scripts", JSON.stringify(this.scripts));

    // this.screen.postMessage(
    //   JSON.stringify({
    //     action: "update_script",
    //     script_id: id,
    //   }),
    // );

    // this.saveState();
  }

  removeScript(id) {
    // for (var i = 0; i < this.state.scripts.length; i++) {
    //   if (this.state.scripts[i] === id) {
    //     this.setScript(i, null);
    //   }
    // }

    // this.screen.postMessage(
    //   JSON.stringify({
    //     action: "remove_script",
    //     script_id: id,
    //   }),
    // );

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
    let { slot, video } = selected;

    if (slot === null || video === null) {
      return;
    }

    let effect = this.state.slots[slot].effect;

    if (effect === "__script") {
      console.log(this.state.slots[slot].script);
      this.state.slots[slot].script.values[idx] = parseFloat(value);
    } else {
      this.state.slots[slot].values[video][idx] = parseFloat(value);
    }

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
  }

  setSlot(idx, effect) {
    let slot = this.state.slots[idx];

    slot.effect = effect;
    if (effect === null) {
      slot.label = "Empty";
    } else if (effect === "__script") {
      slot.label = slot.script.label;
    } else {
      slot.label = this.effects.find((e) => e.id === effect).label;
    }

    slot.values = new Array(6).fill().map((v) => {
      return [0, 0];
    });

    let used = [];
    let unused = Effects.map((e) => e.id);
    let effects = [];
    let scripts = [];

    for (var i = 0; i < this.state.slots.length; i++) {
      let effect = this.state.slots[i].effect;

      if (!!effect) {
        if (effect === "__script") {
          scripts.push({
            slot: this.state.slots[i],
          });
        } else {
          used.push({
            id: effect,
            slot: this.state.slots[i],
          });
          unused.splice(unused.indexOf(effect), 1);
        }
      }
    }

    unused = unused.map((id) => {
      let e = Effects.find((fx) => fx.id === id);

      return {
        id: id,
        slot: {
          label: e.label,
          values: new Array(6).fill(null).map(() => {
            return [0, 0];
          }),
        },
      };
    });

    effects = [...used, ...unused].map((effect) => {
      return {
        ...effect,
        context: null,
      };
    });

    this.state = {
      ...this.state,
      slots: [...this.state.slots],
      scripts: scripts,
      effects: effects,
    };

    this.screen.postMessage(
      JSON.stringify({
        action: "update_slot",
        idx: idx,
        slot: slot,
        state: this.state,
      }),
    );

    this.saveState();
  }

  updateSlot(idx, updates) {
    let slot = this.state.slots[idx];

    for (var x in updates) {
      slot[x] = updates[x];
    }

    this.state = { ...this.state, slots: [...this.state.slots] };

    this.screen.postMessage(
      JSON.stringify({
        action: "update_slot",
        idx: idx,
        slot: slot,
        state: this.state,
      }),
    );

    this.saveState();
  }
}

window.addEventListener("load", () => {
  const config = { ...Config.default };

  const app = new App(config);
  const appEl = document.querySelector("sensory-controls");

  const storage = new Storage(app);

  appEl.storage = storage;
  appEl.app = app;
});
