import { Config } from "./libs/config.js";
import { Video } from "./libs/videos.js";
import { Effect } from "./libs/effects.js";
import { Group, Shape, GroupToggle } from "./libs/shapes.js";

import { Effects } from "./effects";

const defaultTriangle = [
  [0.4, 0.4],
  [0.6, 0.4],
  [0.5, 0.6],
];

class App {
  constructor(config) {
    this.id = this.gen_id();
    this.name = "My Project";
    this.config = config;
    this.screen = null;

    this.colors = {
      bg: 25,
      fg: 186,
      hd: 200,
    };

    this.state = this.defaultState();

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

  gen_id() {
    return (Math.random() * 1000000) | 0;
  }

  save() {
    let projects = this.getProjects();
    let idx = projects.findIndex((p) => p.id === this.id);

    if (idx === -1) {
      projects.push({
        id: this.id,
        name: this.name,
        state: JSON.parse(JSON.stringify(this.state)),
      });
    } else {
      projects.splice(idx, 1, {
        id: this.id,
        name: this.name,
        state: JSON.parse(JSON.stringify(this.state)),
      });
    }

    this.updateProjectList();
    localStorage.setItem("projects", JSON.stringify(projects));
  }

  load(id) {
    let projects = this.getProjects();
    let project = projects.find((p) => p.id === id);

    this.id = project.id;
    this.name = project.name;
    this.state = JSON.parse(JSON.stringify(project.state));

    // Get the project from local storage,
    // load the id, name, and state
    // clear all videos

    this.updateProjectList();
    this.setValues();
  }

  getProjects() {
    return JSON.parse(localStorage.getItem("projects")) || [];
  }

  deleteProject() {
    let projects = this.getProjects();
    let idx = projects.findIndex((p) => p.id === this.id);

    if (idx !== -1) {
      let project = projects[idx];
      projects.splice(idx, 1);

      if (project.id === this.id) {
        this.resetState();
      }
    }

    localStorage.setItem("projects", JSON.stringify(projects));
    this.updateProjectList();
  }

  downloadProjects() {
    let projects = this.getProjects();
    let dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(projects, null, 2));

    let a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("class", "hidden");
    a.setAttribute("download", "sensory_control_projects.json");

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  uploadProjects(e) {
    // Stub
  }

  saveState() {
    localStorage.setItem("auto", JSON.stringify(this.state));
  }

  resetState() {
    // Stub
  }

  defaultState() {
    let { config } = this;

    return {
      videos: new Array(config.video_count).fill().map((_, idx) => {
        return {
          id: this.gen_id(),
          label: `Video ${idx + 1}`,
          values: new Array(config.effect_count).fill().map(() => {
            return new Array(config.effect_parameter_count).fill(0);
          }),
        };
      }),

      effects: new Array(config.effect_count).fill().map((_, idx) => {
        return null;
      }),

      groups: new Array(config.group_count).fill().map((_, idx) => {
        return {
          id: this.gen_id(),
          editable: idx !== 0,
          opacity: new Array(config.video_count).fill(0),
          label: idx === 0 ? "All" : `Group ${idx}`,
          shapes: [],
        };
      }),

      shapes: [
        {
          id: this.gen_id(),
          type: "triangle",
          label: "Triangle 1",
          opacity: new Array(config.video_count).fill(0),
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
          id: this.gen_id(),
          type: "triangle",
          label: "Triangle 2",
          opacity: new Array(config.video_count).fill(0),
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
          // 56: 0,
          // 54: 1,
          // 55: 2,
        },
        sliders: {
          input: {
            56: 1,
            54: 0,
            55: 2,
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
    let { buttons, sliders } = this.state.notes;

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
            } else if (sliders.input.hasOwnProperty(note)) {
              let idx = sliders.input[note];
              let inputs = document.querySelectorAll(
                ".inputs input[type='range']",
              );

              console.log("velocity", velocity);

              let input = inputs[idx];
              input.value = velocity / 127;
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }
          };
        }
      }

      for (const entry of this.midiAccess.outputs) {
        if (entry[1].id === "987282012") {
          this.midiOutput = entry[1];
        }
      }
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

    document
      .querySelector("#project_name")
      .addEventListener("input", this.updateProjectName.bind(this));

    document
      .querySelector("#save_btn")
      .addEventListener("click", this.save.bind(this));

    this.updateProjectList();

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
        this.saveState();
      }
    });

    document
      .querySelector("#download-projects")
      .addEventListener("click", () => {
        this.downloadProjects();
      });

    // TODO for disabling all click for MIDI Map Mode
    // document.addEventListener(
    //   "click",
    //   (e) => {
    //     e.stopPropagation();
    //     e.preventDefault();
    //   },
    //   true,
    // );
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

  updateProjectName(e) {
    this.name = e.target.value;
  }

  updateProjectList() {
    let projectList = document.querySelector("#project_list");
    let projects = this.getProjects();

    projectList.innerHTML = "";
    if (projects.length > 0) {
      projects.map((p) => {
        let item = document.createElement("li");

        item.innerText = p.name;
        item.className = `clickable ${p.id === this.id ? "active" : ""}`;
        item.addEventListener("click", () => {
          this.load(p.id);
        });

        projectList.appendChild(item);
      });
    } else {
      let item = document.createElement("li");

      item.innerText = "No Saved Projects";
      projectList.appendChild(item);
    }
  }

  toggleSlideout() {
    let el = document.querySelector(".slideout");

    if (el.classList.contains("active")) {
      el.classList.remove("active");
      el.querySelector("#slideout-handle").setAttribute(
        "uk-icon",
        "chevron-double-left",
      );

      document.querySelector("#page").classList.remove("slideout-active");
    } else {
      el.classList.add("active");
      el.querySelector("#slideout-handle").setAttribute(
        "uk-icon",
        "chevron-double-right",
      );

      document.querySelector("#page").classList.add("slideout-active");
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

  setupVideos() {
    let { updateVideo, toggleVideo, selectedVideos, removeVideo } = this;
    let { videos } = this.state;

    for (var i = 0; i < videos.length; i++) {
      let video = new Video(
        i,
        videos[i],
        updateVideo.bind(this),
        toggleVideo.bind(this),
        removeVideo.bind(this),
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
        // effect.el
        //   .querySelector("input[type='radio']")
        //   .setAttribute("checked", true);
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
  }

  addShape() {
    if (!this.screen) {
      return;
    }

    let { shapes, groups } = this.state;

    let idx = shapes.length;
    let shape = {
      id: this.gen_id(),
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

    this.saveState();
  }

  removeShape() {
    // Stub
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

    this.saveState();
  }

  toggleVideo(idx) {
    this.selectedVideos[0] = idx;
    // console.log(idx);

    // if (this.selectedVideos.includes(idx)) {
    //   this.selectedVideos.splice(this.selectedVideos.indexOf(idx), 1);
    // } else {
    //   this.selectedVideos.push(idx);
    // }

    this.setValues();
  }

  removeVideo(idx) {
    let video = this.state.videos[idx];
    video.values = new Array(6).fill().map((a) => {
      return [0, 0];
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
    this.state.effects[idx] = effect;

    this.screen.postMessage(
      JSON.stringify({
        action: "set_effect",
        effectIdx: idx,
        effect: effect,
        state: this.state,
      }),
    );

    this.saveState();
  }

  setValues() {
    let selectedVideo = this.selectedVideos[0];
    let selectedGroup = this.selectedGroup;
    let selectedEffect = this.selectedEffect;

    let opacity = this.state.groups[selectedGroup].opacity[selectedVideo];
    let effect_a = this.state.videos[selectedVideo].values[selectedEffect][0];
    let effect_b = this.state.videos[selectedVideo].values[selectedEffect][1];

    document.querySelectorAll(".inputs input")[0].value = opacity;
    document.querySelectorAll(".inputs input")[1].value = effect_a;
    document.querySelectorAll(".inputs input")[2].value = effect_b;

    this.setMidi();
  }

  setMidi() {
    let selectedVideo = this.selectedVideos[0];
    let selectedGroup = this.selectedGroup;
    let selectedEffect = this.selectedEffect;

    let opacity = this.state.groups[selectedGroup].opacity[selectedVideo];
    let effect_a = this.state.videos[selectedVideo].values[selectedEffect][0];
    let effect_b = this.state.videos[selectedVideo].values[selectedEffect][1];

    let { sliders } = this.state.notes;
    let notes = Object.keys(sliders.output);

    if (!!this.midiOutput) {
      this.midiOutput.send([144, notes[0], (opacity * 127) | 0]);
    }
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

new App(Config.default);
