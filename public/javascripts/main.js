const defaultTriangles = [
  [[0.01, 0.01], [0.5, 0.5], [0.01, 0.99], 0.3],
  [[0.99, 0.01], [0.5, 0.5], [0.99, 0.99], 0.3],
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

    this.groups = JSON.parse(localStorage.getItem("groups")) || [
      [
        [[0.01, 0.01], [0.5, 0.5], [0.01, 0.99], 0.3],
        [[0.99, 0.01], [0.5, 0.5], [0.99, 0.99], 0.3],
      ],
      [
        [[0.01, 0.01], [0.5, 0.5], [0.01, 0.99], 0.3],
        [[0.99, 0.01], [0.5, 0.5], [0.99, 0.99], 0.3],
      ],
      [
        [[0.01, 0.01], [0.5, 0.5], [0.01, 0.99], 0.3],
        [[0.99, 0.01], [0.5, 0.5], [0.99, 0.99], 0.3],
      ],
      [
        [[0.01, 0.01], [0.5, 0.5], [0.01, 0.99], 0.3],
        [[0.99, 0.01], [0.5, 0.5], [0.99, 0.99], 0.3],
      ],
      [
        [[0.01, 0.01], [0.5, 0.5], [0.01, 0.99], 0.3],
        [[0.99, 0.01], [0.5, 0.5], [0.99, 0.99], 0.3],
      ],
    ];
  }

  launch() {
    // console.log(this.screen);

    // this.screen = window.open("./screen.html");
    this.buildUI();
    this.rotateColors();
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
    for (var v in this.videos) {
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

      for (var i = 0; i < this.groups.length; i++) {
        let opacity = document.createElement("input");

        opacity.type = "range";
        opacity.className = "uk-range";
        opacity.max = 1;
        opacity.min = 0;
        opacity.step = 0.01;
        opacity.value = this.groups[i][0][3];

        controls.appendChild(opacity);
      }

      document.querySelector("#videos").appendChild(wrapper);
    }
  }
}

let app = null;
window.addEventListener("load", () => {
  app = new App();
  app.launch();
});
