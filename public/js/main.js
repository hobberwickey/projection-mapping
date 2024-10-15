/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/js/libs/config.js
const Config = {
  default: {
    video_count: 6,
    effect_count: 6,
    group_count: 6
  }
};
;// ./src/js/libs/videos.js
class Video {
  constructor(idx, onChange, onEffect, onSelect) {
    this.idx = idx;
    this.onChange = e => {
      this.el.querySelector("video").src = URL.createObjectURL(e.target.files[0]);
      this.el.querySelector("video").currentTime = 50;
      this.el.querySelector(".preview").classList.remove("no-video");
      onChange(idx, e.target.files[0]);
    };
    this.onEffect = (effect, e) => {
      onEffect(idx, effect, e.target.value);
    };
    this.onSelect = e => {
      console.log(e);
    };
    this.el = document.createElement("div");
    this.el.className = "video uk-card uk-card-small uk-card-default";
    this.el.innerHTML = `
			<div>
				<div class='left'>
					<div id='video-${this.idx}' class="uk-card-header">
		        <input type='text' class="uk-card-title" value='Video ${this.idx + 1}'></input>
		    	</div>
					<div class="uk-card-body">
						<div class='preview no-video'>
							<video></video>
							<p>
								No Video
							</p>
						</div>
						<div class='upload-wrapper'>
							<label class='uk-label' for='video-${this.idx}-input'>Upload</label>
							<input id='video-${this.idx}-input' type='file' />
						</div>
					</div>
				</div>
				<div class='right'>
					<div class='inputs'>
						<input type='range' min="0" max="1" step="0.01" value="0" class='uk-range effect-a' />
						<input type='range' min="0" max="1" step="0.01" value="0" class='uk-range effect-b' />
						<input type='range' min="0" max="1" step="0.01" value="0" class='uk-range effect-c' />
					</div>
				</div>
			</div>
		`;
    this.el.querySelector(".upload-wrapper input").addEventListener("change", this.onChange.bind(this));
    this.el.querySelector(".effect-a").addEventListener("input", this.onEffect.bind(this, "effect_a"));
    this.el.querySelector(".effect-b").addEventListener("input", this.onEffect.bind(this, "effect_b"));
    this.el.querySelector(".effect-c").addEventListener("input", this.onEffect.bind(this, "effect_c"));
  }
}
;// ./src/js/libs/effects.js
const effects = [{
  id: "default",
  label: "Video Controls",
  effect_a: "Opacity",
  effect_b: "Playback",
  effect_c: "Position"
}, {
  id: "cosine_pallet",
  label: "Cosine Pallet",
  effect_a: "Opacity",
  effect_b: "Intensity",
  effect_c: "Shift"
}, {
  id: "rgb_opacity",
  label: "RGB Opacity",
  effect_a: "R Opacity",
  effect_b: "B Opacity",
  effect_c: "G Opacity"
}, {
  id: "sine_distort",
  label: "Sine Distort",
  effect_a: "Opacity",
  effect_b: "Horizontal",
  effect_c: "Vertical"
}, {
  id: "prism",
  label: "Prism",
  effect_a: "Opacity",
  effect_b: "Horizontal",
  effect_c: "Vertical"
}, {
  id: "pixelate",
  label: "Pixelate",
  effect_a: "Opacity",
  effect_b: "Pallete Depth"
}];
class Effect {
  constructor(idx) {
    this.idx = idx;
    this.onChange = e => {
      this.el.querySelector("video").src = URL.createObjectURL(e.target.files[0]);
      this.el.querySelector(".preview").classList.remove("no-video");
    };
    this.onSelect = e => {
      console.log(e);
    };
    this.el = document.createElement("div");
    this.el.className = "effect";
    this.el.innerHTML = `
			<ul class='uk-list'>
				<li>
					<select class='uk-select'>
						<option value=''>No Effect</option>
					</select>

					<div class='uk-flex uk-flex-inline'>
						<div class='effect-a'></div>
						<div class='effect-b'></div>
						<div class='effect-c'></div>
					</div>
				</li>
			</ul>
		`;
    effects.map(effect => {
      let option = document.createElement("option");
      option.value = effect.label;
      option.innerText = effect.label;
      this.el.querySelector("select").appendChild(option);
      this.el.querySelector("select").addEventListener("change", this.onChange.bind(this));
    });
  }
}
;// ./src/js/libs/shapes.js
class Shapes {
  constructor(idx) {
    this.updateLabel = e => {
      console.log(idx, e.target.value);
    };
    this.el = document.createElement("th");
    this.el.innerHTML = `
			<div>
				<input type='text' value="${idx === 0 ? "All" : "Group " + idx}" />
			</div>
		`;
    this.el.querySelector("input").addEventListener("input", this.updateLabel.bind(this));
  }
}
class Triangle {
  constructor(idx) {
    this.updateLabel = e => {
      console.log(idx, e.target.value);
    };
    this.el = document.createElement("td");
    this.el.innerHTML = `
			<input type='text' value="Triangle ${idx + 1}" />
		`;
    this.el.querySelector("input").addEventListener("input", this.updateLabel.bind(this));
  }
}
class Group {
  constructor(triangleIdx, groupIdx) {
    this.toggleGroup = () => {
      console.log(triangleIdx, groupIdx);
    };
    this.el = document.createElement("td");
    if (groupIdx === 0) {
      this.el.innerHTML = `
				<input class='uk-checkbox' type='checkbox' checked disabled value="${groupIdx}"  />
			`;
    } else {
      this.el.innerHTML = `
				<input class='uk-checkbox' type='checkbox' value="${groupIdx}"  />
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
          effect_c: 0
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

    document.querySelector("#launch").addEventListener("click", this.popout.bind(this));
    document.querySelector("#add_triangle").addEventListener("click", this.addTriangle.bind(this));
  }
  popout() {
    this.screen = window.open("./screen.html");
  }
  rotateColors() {
    this.colors.bg = (this.colors.bg + 0.05) % 360;
    this.colors.fg = (this.colors.fg + 0.02) % 360;
    this.colors.hd = (this.colors.hd + 0.03) % 360;
    document.body.style.backgroundColor = `hsl(${this.colors.bg}deg 20.54% 90.41%)`;
    document.querySelector("nav").style.backgroundColor = `hsl(${this.colors.hd}deg 20.54% 90.41%)`;
    document.querySelector(":root").style.setProperty("--fg-color", `hsl(${this.colors.fg}deg 20.54% 50.41%)`);
    window.requestAnimationFrame(this.rotateColors.bind(this));
  }
  setupVideos() {
    let {
      updateVideo,
      updateEffect
    } = this;
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
      let g = {
        triangles: [],
        values: []
      };
      for (var j = 0; j < this.config.effect_count; j++) {
        g.values.push({
          effect_a: 0,
          effect_b: 0,
          effect_c: 0
        });
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
    this.screen.postMessage(JSON.stringify({
      action: "add_triangle",
      triangle: defaultTriangle
    }));
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
    this.screen.postMessage(JSON.stringify({
      action: "reset_video",
      videoIdx: videoIdx
    }));
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
    this.screen.postMessage(JSON.stringify({
      action: "update_effects",
      videoIdx: videoIdx,
      effectIdx: effectIdx,
      effect_a: values.effect_a,
      effect_b: values.effect_b,
      effect_c: values.effect_c
    }));
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