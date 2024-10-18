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
  constructor(video, onChange, onEffect, onSelect) {
    this.onChange = e => {
      this.el.querySelector("video").src = URL.createObjectURL(e.target.files[0]);
      this.el.querySelector("video").currentTime = 50;
      this.el.querySelector(".preview").classList.remove("no-video");
      onChange(video, e.target.files[0]);
    };
    this.onEffect = (effect, e) => {
      onEffect(video, effect, e.target.value);
    };
    this.onSelect = e => {
      console.log(e);
    };
    this.el = document.createElement("div");
    this.el.className = "video uk-card uk-card-small uk-card-default";
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
							<input id='video-${video.id}-input' type='file' />
						</div>
					</div>
				</div>
				
			</div>
		`;
    this.el.querySelector(".upload-wrapper input").addEventListener("change", this.onChange.bind(this));

    // this.el
    // 	.querySelector(".opacity")
    // 	.addEventListener("input", this.onEffect.bind(this, "opacity"));

    // this.el
    // 	.querySelector(".effect-b")
    // 	.addEventListener("input", this.onEffect.bind(this, "effect_b"));

    // this.el
    // 	.querySelector(".effect-c")
    // 	.addEventListener("input", this.onEffect.bind(this, "effect_c"));
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
  id: "cosine_pallet",
  label: "Cosine Pallet",
  opacity: "Opacity",
  effect_a: "Intensity",
  effect_b: "Shift"
}, {
  id: "rgb_opacity",
  label: "RGB Opacity",
  opacity: "R Opacity",
  effect_a: "B Opacity",
  effect_b: "G Opacity"
}, {
  id: "sine_distort",
  label: "Sine Distort",
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
  constructor(idx, effect) {
    this.idx = idx;
    this.onChange = e => {
      console.log(idx, effect, e.target.value);
    };
    this.onSelect = e => {
      console.log(idx, effect);
    };
    this.el = document.createElement("div");
    this.el.className = "effect";
    this.el.innerHTML = `
			<ul class='uk-list'>
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
      option.checked = e.id === effect;
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
  constructor(idx, group) {
    this.onUpdate = e => {
      console.log(idx, group.id, e.target.value);
    };
    this.onSelect = e => {
      console.log(idx, group.id, e.target.value);
    };
    this.el = document.createElement("div");
    this.el.className = "row group";
    this.el.innerHTML = `
			<div>
				<input type='text' value="${group.label}" />
				<input class='uk-radio' name='group' type='radio' value="${group.id}"  />
			</div>
		`;
    this.el.querySelector("input[type='text']").addEventListener("input", this.onUpdate.bind(this));
  }
}
class GroupToggle {
  constructor(groupIdx, shapeIdx, onToggle) {
    this.toggleGroup = () => {
      console.log(shapeIdx, groupIdx);
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
    this.selectedEffect = [0];
    this.midiAccess = null;
    this.midiInput = null;
    this.midiOutput = null;
    this.setupVideos();
    this.setupGroups();
    this.setupEffects();
    this.setupMidi();
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
          values: new Array(config.effect_parameter_count).fill(0)
        };
      }),
      effects: new Array(config.effect_count).fill().map((_, idx) => {
        return idx === 0 ? "cosine_pallet" : null;
      }),
      groups: new Array(config.group_count).fill().map((_, idx) => {
        return {
          id: this.id(),
          editable: idx !== 0,
          label: idx === 0 ? "All" : `Group ${idx}`,
          shapes: []
        };
      }),
      shapes: [{
        id: this.id(),
        type: "triangle",
        label: "Triangle 1",
        opacity: 0,
        points: JSON.parse(JSON.stringify(defaultTriangle))
      }, {
        id: this.id(),
        type: "triangle",
        label: "Triangle 2",
        opacity: 0,
        points: JSON.parse(JSON.stringify(defaultTriangle))
      }]
    };
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
    this.rotateColors();
    document.querySelector("#launch").addEventListener("click", this.popout.bind(this));
    document.querySelector("#add_triangle").addEventListener("click", this.addShape.bind(this));
    document.querySelector("#slideout-handle").addEventListener("click", this.toggleSlideout.bind(this));
  }
  popout() {
    this.screen = window.open("./screen.html");
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
    window.requestAnimationFrame(this.rotateColors.bind(this));
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
    let {
      updateVideo,
      updateEffect,
      toggleVideo
    } = this;
    let {
      videos
    } = this.state;
    for (var i = 0; i < videos.length; i++) {
      let video = new Video(videos[i], updateVideo.bind(this), updateEffect.bind(this), toggleVideo.bind(this));
      document.querySelector("#videos").appendChild(video.el);
    }
  }
  setupEffects() {
    let {
      effects
    } = this.state;
    for (var i = 0; i < effects.length; i++) {
      let effect = new Effect(i, effects[i], this.selectEffect.bind(this));
      document.querySelector("#effects").appendChild(effect.el);
    }
  }
  setupGroups() {
    let {
      groups,
      shapes
    } = this.state;
    for (var i = 0; i < groups.length; i++) {
      let group = new Group(i, groups[i]);
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
    this.screen.postMessage(JSON.stringify({
      action: "add_triangle",
      triangle: defaultTriangle
    }));
    let {
      shapes,
      groups
    } = this.state;
    let idx = shapes.length;
    let shape = {
      id: this.id(),
      type: "triangle",
      label: `Triangle ${idx + 1}`,
      opacity: 0,
      points: JSON.parse(JSON.stringify(defaultTriangle))
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
  }
  updateVideo(video, file) {
    if (!this.screen) {
      return;
    }
    this.screen.postMessage(JSON.stringify({
      action: "reset_video",
      videoId: video.id
    }));
    this.screen.postMessage(file);
  }
  updateEffect(videoIdx, effect, value) {
    if (!this.screen) {
      return;
    }
    if (effect === "opacity") {}
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
  toggleVideo(idx) {
    if (this.selectedVideos.contains(idx)) {
      this.selectedVideos.splice(this.selectedVideos.indexOf(idx), 1);
    } else {
      this.selectedVideo.push(idx);
    }

    //this.setValues();
  }
  toggleGroup(shapeIdx, groupIdx) {
    console.log(shapeIdx, groupIdx);
  }
  selectEffect(idx) {
    this.selectedEffect = idx;

    // this.setValues();
  }
  selectGroup(idx) {
    this.selectedGroup[0] = idx;

    // this.setValues();
  }
  selectShape(idx) {
    this.selectedShape = idx;
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