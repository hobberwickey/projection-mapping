const defaultTriangle = [
  [0.3, 0.3],
  [0.7, 0.3],
  [0.5, 0.7],
];

class App {
  constructor() {
    this.screen = null;

    this.colors = {
      bg: 25,
      fg: 186,
      hd: 200,
    };

    this.videos = {
      Jellyfish: "/videos/jellyfish.mp4",
      Pines: "/videos/pines.mp4",
      Lines: "/videos/lines.mp4",
      Trippy: "/videos/trippy.mp4",
      Ink: "/videos/ink.mp4",
      Pika: "/videos/pika.mp4",
    };

    this.groups = [];

    this.midiAccess = null; // global MIDIAccess object
    this.midiInput = null;
    this.midiOutput = null;

    const onMIDISuccess = (midiAccess) => {
      this.midiAccess = midiAccess; // store in the global (in real usage, would probably keep in an object instance)

      for (const entry of this.midiAccess.inputs) {
        console.log(entry[1]);

        if (entry[1].id === "-1994529889") {
          this.midiInput = entry[1];

          entry[1].onmidimessage = (e) => {
            console.log("Arduino", e);
          };
        }

        if (entry[1].id === "325563316") {
          this.midiInput = entry[1];

          entry[1].onmidimessage = (e) => {
            console.log("APK", e);
          };
        }
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

  launch() {
    this.buildUI();
    this.rotateColors();

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

  buildUI() {
    Object.keys(this.videos).map((v, vIdx) => {
      let wrapper = document.createElement("div");
      let video = document.createElement("div");
      let label = document.createElement("label");
      let controls = document.createElement("ul");

      video.className = "uk-card uk-card-default uk-card-small uk-card-body";
      label.className = "uk-card-title";
      label.innerText = v;
      controls.className = "uk-list";

      wrapper.appendChild(video);
      video.appendChild(label);
      video.appendChild(controls);

      for (var i = 0; i < 1; i++) {
        let opacity = document.createElement("input");

        opacity.type = "range";
        opacity.className = "uk-range";
        opacity.max = 1;
        opacity.min = 0;
        opacity.step = 0.01;
        opacity.value = 0;
        opacity.addEventListener("input", this.updateOpacity.bind(this, vIdx));

        controls.appendChild(opacity);
      }

      document.querySelector("#videos").appendChild(wrapper);
    });
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
  }

  updateOpacity(videoIdx, e) {
    if (!this.screen) {
      return;
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "update_opacity",
        videoIdx: videoIdx,
        opacity: e.target.value,
      }),
    );
  }
}

let app = null;
window.addEventListener("load", () => {
  app = new App();
  app.launch();
});
