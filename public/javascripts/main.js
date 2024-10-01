const defaultTriangles = [
  [[0.2, 0.2], [0.5, 0.5], [0.2, 0.8], 0],
  [[0.8, 0.2], [0.5, 0.5], [0.8, 0.8], 0],
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
      Clouds: "/videos/clouds.mp4",
      Rain: "/videos/rain.mp4",
      Snow: "/videos/snow.mp4",
      Crabs: "/videos/bbc_crabs.mp4",
      Rave: "/videos/crab_rave.mp4",
      _Clouds: "/videos/clouds.mp4",
      _Rain: "/videos/rain.mp4",
      _Snow: "/videos/snow.mp4",
      _Crabs: "/videos/bbc_crabs.mp4",
    };

    this.groups = JSON.parse(localStorage.getItem("groups")) || [];
    // this.convert();
  }

  launch() {
    this.buildUI();
    this.rotateColors();

    document
      .querySelector("#launch")
      .addEventListener("click", this.popout.bind(this));

    document
      .querySelector("#add_triangle")
      .addEventListener("click", this.addGroup.bind(this));
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

      for (var i = 0; i < this.groups[vIdx].length; i++) {
        let group = this.groups[vIdx][i];
        let opacity = document.createElement("input");

        opacity.type = "range";
        opacity.className = "uk-range";
        opacity.max = 1;
        opacity.min = 0;
        opacity.step = 0.01;
        opacity.value = group.opacity;
        opacity.addEventListener(
          "input",
          this.updateOpacity.bind(this, vIdx, group),
        );

        controls.appendChild(opacity);
      }

      document.querySelector("#videos").appendChild(wrapper);
    });
  }

  addGroup() {
    if (!this.screen) {
      return;
    }

    this.screen.postMessage(
      JSON.stringify({
        action: "add_triangles",
        triangles: defaultTriangles,
      }),
    );

    Object.keys(this.videos).map((v, vIdx) => {
      let group = { opacity: 0.0, idx: this.groups[vIdx].length };

      this.groups[vIdx].push(group);
      let videos = [...document.querySelectorAll("#videos .uk-list")].forEach(
        (controls, idx) => {
          let opacity = document.createElement("input");

          opacity.type = "range";
          opacity.className = "uk-range";
          opacity.max = 1;
          opacity.min = 0;
          opacity.step = 0.01;
          opacity.value = 0.0;
          opacity.addEventListener(
            "input",
            this.updateOpacity.bind(this, idx, group),
          );

          controls.appendChild(opacity);
        },
      );
    });

    localStorage.setItem("groups", JSON.stringify(this.groups));
  }

  updateOpacity(videoIdx, group, e) {
    if (!this.screen) {
      return;
    }

    group.opacity = e.target.value;
    this.screen.postMessage(
      JSON.stringify({
        action: "update_opacity",
        videoIdx: videoIdx,
        groupIdx: group.idx,
        opacity: group.opacity,
      }),
    );

    localStorage.setItem("groups", JSON.stringify(this.groups));
  }

  // convert() {
  //   let realGroups = [];
  //   Object.keys(this.videos).map((key) => {
  //     let videoGroups = [];
  //     this.groups.map((group) => {
  //       videoGroups.push(JSON.parse(JSON.stringify(group)));
  //     });
  //     realGroups.push(videoGroups);
  //   });

  //   localStorage.setItem("groups", JSON.stringify(realGroups));
  // }
}

let app = null;
window.addEventListener("load", () => {
  app = new App();
  app.launch();
});
