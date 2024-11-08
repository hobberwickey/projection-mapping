/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/js/libs/config.js
const Config = {
  default: {
    video_count: 6,
    effect_count: 6,
    group_count: 6,
    effect_parameter_count: 2
  }
};
;// ./src/js/libs/videos.js
class Video {
  constructor(idx, video, onChange, onSelect) {
    this.onChange = e => {
      this.el.querySelector("video").src = URL.createObjectURL(e.target.files[0]);
      this.el.querySelector("video").currentTime = 50;
      this.el.querySelector(".preview").classList.remove("no-video");
      onChange(idx, video, e.target.files[0]);
    };
    this.onSelect = e => {
      onSelect(idx);
      document.querySelector(".video.selected").classList.remove("selected");
      this.el.classList.add("selected");
    };
    this.el = document.createElement("div");
    this.el.className = `video uk-card uk-card-small uk-card-default`;
    this.el.innerHTML = `
			<div>
				<div class='left'>
					<div id='video-${video.id}' class="uk-card-header">
						<input type='radio' name='video' class='uk-radio' 
		        /><input type='text' class="uk-card-title" value='${video.label}'></input>
		    	</div>
					<div class="uk-card-body">
						<div class='preview no-video upload-wrapper'>
							<video></video>
							<p>
								No Video
							</p>
							<label class='uk-label' for='video-${video.id}-input'></label>
							<input id='video-${video.id}-input' type='file' accept="video/mp4,video/x-m4v,video/*" />
						</div>
					</div>
				</div>
			</div>
		`;
    this.el.querySelector(".upload-wrapper input").addEventListener("change", this.onChange.bind(this));
    this.el.querySelector("input[type='radio']").addEventListener("change", this.onSelect.bind(this));
  }
}
;// ./src/js/libs/effects.js
const effects = [{
  id: "default",
  label: "Video Controls",
  opacity: "Opacity",
  effect_a: "Playback",
  effect_b: "Position"
}, {
  id: "cosine_palette",
  label: "Cosine Palette",
  opacity: "Opacity",
  effect_a: "Intensity",
  effect_b: "Shift"
}, {
  id: "color_opacity",
  label: "Color Opacity",
  opacity: "Opacity",
  effect_a: "Hue",
  effect_b: "Sensitivity"
}, {
  id: "cosine_distort",
  label: "Cosine Distort",
  opacity: "Opacity",
  effect_a: "Horizontal",
  effect_b: "Vertical"
}, {
  id: "prism",
  label: "Prism",
  opacity: "Opacity",
  effect_a: "Horizontal",
  effect_b: "Vertical"
}, {
  id: "pixelate",
  label: "Pixelate",
  opacity: "Opacity",
  effect_a: "Pixel Size",
  effect_b: "Pallete Depth"
}];
class Effect {
  constructor(idx, effect, onSelect, onChange) {
    this.idx = idx;
    this.onChange = e => {
      console.log(idx, effect, e.target.value);
      onChange(idx, e.target.value);
    };
    this.onSelect = e => {
      console.log(idx, effect);
      onSelect(idx);
    };
    this.el = document.createElement("div");
    this.el.className = "effect";
    this.el.innerHTML = `
			<ul class='uk-list fx-clr-${idx}'>
				<li>
					<div>
						<input name='effect' class='uk-radio' type='radio' value='${effect}' 
						/><label>
							<select class='uk-select'>
								<option value=''>No Effect</option>
							</select>
						</label>
					</div>
				</li>
			</ul>
		`;
    effects.map(e => {
      let option = document.createElement("option");
      option.value = e.id;
      option.innerText = e.label;
      option.selected = e.id === effect;
      this.el.querySelector("select").appendChild(option);
    });
    this.el.querySelector("select").addEventListener("change", this.onChange.bind(this));
    this.el.querySelector("input").addEventListener("change", this.onSelect.bind(this));
  }
}
;// ./src/js/libs/shapes.js
class Shape {
  constructor(idx, shape, onSelect, onUpdate) {
    this.onUpdate = e => {
      console.log(idx, shape.id, e.target.value);
    };
    this.onSelect = e => {
      console.log(idx, shape.id, e.target.value);
    };
    this.el = document.createElement("div");
    this.el.className = "row header";
    this.el.innerHTML = `
			<div>
				<input type='radio' name='shape' class='uk-radio' 
				/><input type='text' value="${shape.label}" />
			</div>
		`;
    this.el.querySelector("input").addEventListener("input", this.onUpdate.bind(this));
  }
}
class Group {
  constructor(idx, group, onSelect) {
    this.onUpdate = e => {
      console.log(idx, group.id, e.target.value);
    };
    this.onSelect = e => {
      onSelect(idx);
    };
    this.el = document.createElement("div");
    this.el.className = `row group grp-clr-${idx}`;
    this.el.innerHTML = `
			<div>
				<input type='text' value="${group.label}" />
				<input class='uk-radio' name='group' type='radio' value="${group.id}"  />
			</div>
		`;
    this.el.querySelector("input[type='text']").addEventListener("input", this.onUpdate.bind(this));
    this.el.querySelector("input[type='radio']").addEventListener("input", this.onSelect.bind(this));
  }
}
class GroupToggle {
  constructor(groupIdx, shapeIdx, onToggle) {
    this.toggleGroup = () => {
      onToggle(shapeIdx, groupIdx);
    };
    this.el = document.createElement("div");
    this.el.className = "row toggle";
    if (groupIdx !== 0) {
      this.el.innerHTML = `
				<div>
					<input class='uk-checkbox' type='checkbox' value="${groupIdx}"  />
				</div>
			`;
    } else {
      this.el.innerHTML = `
				<div>
					<input class='uk-checkbox' type='checkbox' checked disabled value="${groupIdx}"  />
				</div>
			`;
    }
    this.el.querySelector("input").addEventListener("input", this.toggleGroup.bind(this));
  }
}
;// ./src/js/main.js




const defaultTriangle = [[0.4, 0.4], [0.6, 0.4], [0.5, 0.6]];
class App {
  constructor(config) {
    this.config = config;
    this.screen = null;
    this.colors = {
      bg: 25,
      fg: 186,
      hd: 200
    };
    this.state = JSON.parse(localStorage.getItem("saves"))?.auto || this.defaultState();
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
    return Math.random() * 1000000 | 0;
  }
  defaultState() {
    let {
      config
    } = this;
    return {
      videos: new Array(config.video_count).fill().map((_, idx) => {
        return {
          id: this.id(),
          label: `Video ${idx + 1}`,
          values: new Array(config.effect_count).fill().map(() => {
            return new Array(config.effect_parameter_count).fill(0);
          })
        };
      }),
      effects: new Array(config.effect_count).fill().map((_, idx) => {
        return null;
      }),
      groups: new Array(config.group_count).fill().map((_, idx) => {
        return {
          id: this.id(),
          editable: idx !== 0,
          opacity: new Array(config.video_count).fill(0),
          label: idx === 0 ? "All" : `Group ${idx}`,
          shapes: []
        };
      }),
      shapes: [{
        id: this.id(),
        type: "triangle",
        label: "Triangle 1",
        opacity: new Array(config.video_count).fill(0),
        points: {
          input: [[0, 0], [1, 0], [1, 1]],
          output: [[0, 0], [1, 0], [1, 1]]
        }
      }, {
        id: this.id(),
        type: "triangle",
        label: "Triangle 2",
        opacity: new Array(config.video_count).fill(0),
        points: {
          input: [[0, 0], [0, 1], [1, 1]],
          output: [[0, 0], [0, 1], [1, 1]]
        }
      }],
      // TODO: this shouldn't be hardcoded. Build a learn setting
      notes: {
        buttons: {
          48: 0,
          53: 1,
          50: 2,
          51: 3,
          49: 4,
          52: 5
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
            55: 2
          },
          output: {
            45: 0,
            46: 1,
            47: 2
          }
        }
      }
    };
  }
  setupMidi() {
    let {
      buttons,
      sliders
    } = this.state.notes;
    const onMIDISuccess = midiAccess => {
      this.midiAccess = midiAccess; // store in the global (in real usage, would probably keep in an object instance)
      for (const entry of this.midiAccess.inputs) {
        if (entry[1].id === "-1994529889") {
          this.midiInput = entry[1];
          entry[1].onmidimessage = e => {
            let note = e.data[1];
            let velocity = e.data[2];
            if (buttons.hasOwnProperty(note)) {
              let idx = buttons[note];
              let inputs = document.querySelectorAll("#videos .video");
              let input = inputs[idx].querySelector("input[type='radio']");
              input.checked = true;
              input.dispatchEvent(new Event("change", {
                bubbles: true
              }));
            } else if (sliders.input.hasOwnProperty(note)) {
              let idx = sliders.input[note];
              let inputs = document.querySelectorAll(".inputs input[type='range']");
              console.log("velocity", velocity);
              let input = inputs[idx];
              input.value = velocity / 127;
              input.dispatchEvent(new Event("input", {
                bubbles: true
              }));
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
    const onMIDIFailure = msg => {
      console.error(`Failed to get MIDI access - ${msg}`);
    };
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }
  launch() {
    if (!!this.screen) {
      return;
    }

    // this.rotateColors();

    document.querySelector("#launch").addEventListener("click", this.popout.bind(this));
    document.querySelector("#add_triangle").addEventListener("click", this.addShape.bind(this));
    document.querySelector("#slideout-handle").addEventListener("click", this.toggleSlideout.bind(this));
    let inputs = document.querySelectorAll(".inputs input[type='range']");
    inputs[0].addEventListener("input", this.updateEffect.bind(this, "opacity"));
    inputs[1].addEventListener("input", this.updateEffect.bind(this, "effect_a"));
    inputs[2].addEventListener("input", this.updateEffect.bind(this, "effect_b"));
    window.addEventListener("message", e => {
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
      this.screen.postMessage(JSON.stringify({
        action: "update_state",
        state: this.state
      }));
    });
  }
  toggleSlideout() {
    let el = document.querySelector(".slideout");
    console.log(el);
    if (el.classList.contains("active")) {
      el.classList.remove("active");
      el.querySelector("#slideout-handle").setAttribute("uk-icon", "chevron-double-left");
    } else {
      el.classList.add("active");
      el.querySelector("#slideout-handle").setAttribute("uk-icon", "chevron-double-right");
    }
  }
  rotateColors() {
    this.colors.bg = (this.colors.bg + 0.05) % 360;
    this.colors.fg = (this.colors.fg + 0.02) % 360;
    this.colors.hd = (this.colors.hd + 0.03) % 360;
    document.body.style.backgroundColor = `hsl(${this.colors.bg}deg 20.54% 90.41%)`;
    document.querySelector("nav").style.backgroundColor = `hsl(${this.colors.hd}deg 20.54% 90.41%)`;
    document.querySelector(":root").style.setProperty("--fg-color", `hsl(${this.colors.fg}deg 20.54% 50.41%)`);

    // window.requestAnimationFrame(this.rotateColors.bind(this));
  }
  setupVideos() {
    let {
      updateVideo,
      toggleVideo,
      selectedVideos
    } = this;
    let {
      videos
    } = this.state;
    for (var i = 0; i < videos.length; i++) {
      let video = new Video(i, videos[i], updateVideo.bind(this), toggleVideo.bind(this));
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
    let {
      effects
    } = this.state;
    for (var i = 0; i < effects.length; i++) {
      let effect = new Effect(i, effects[i], this.selectEffect.bind(this), this.setEffect.bind(this));
      if (this.selectedEffect === i) {
        effect.el.querySelector("input[type='radio']").setAttribute("checked", true);
      }
      document.querySelector("#effects").appendChild(effect.el);
    }
  }
  setupGroups() {
    let {
      groups,
      shapes
    } = this.state;
    let {
      selectGroup
    } = this;
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
    let {
      shapes,
      groups
    } = this.state;
    let idx = shapes.length;
    let shape = {
      id: this.id(),
      type: "triangle",
      label: `Triangle ${idx + 1}`,
      opacity: new Array(this.config.video_count).fill(0.5),
      points: {
        input: JSON.parse(JSON.stringify(defaultTriangle)),
        output: JSON.parse(JSON.stringify(defaultTriangle))
      }
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
    this.screen.postMessage(JSON.stringify({
      action: "update_state",
      state: this.state
    }));
  }
  updateVideo(idx, video, file) {
    if (!this.screen) {
      return;
    }
    this.screen.postMessage(JSON.stringify({
      action: "reset_video",
      videoIdx: idx
    }));
    this.screen.postMessage(file);
  }
  updateEffect(effect, e) {
    if (!this.screen) {
      return;
    }
    let {
      shapes,
      groups,
      videos
    } = this.state;
    let {
      selectedVideos,
      selectedGroup,
      selectedEffect
    } = this;
    let {
      value
    } = e.target;
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
    this.screen.postMessage(JSON.stringify({
      action: "update_state",
      state: this.state
    }));
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
    document.querySelector(":root").style.setProperty("--selected-fx-clr", `var(--fx-clr-${idx}`);
  }
  selectGroup(idx) {
    this.selectedGroup = idx;
    this.setValues();
    document.querySelector(":root").style.setProperty("--selected-grp-clr", `var(--grp-clr-${idx}`);
  }
  selectShape(idx) {
    this.selectedShape = idx;
  }
  setEffect(idx, effect) {
    this.state.effects[idx] = effect;
    this.screen.postMessage(JSON.stringify({
      action: "set_effect",
      effectIdx: idx,
      effect: effect,
      state: this.state
    }));
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
    let {
      sliders
    } = this.state.notes;
    let notes = Object.keys(sliders.output);
    if (!!this.midiOutput) {
      this.midiOutput.send([144, notes[0], opacity * 127 | 0]);
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
console.log(Config.default);
new App(Config.default);
/******/ })()
;