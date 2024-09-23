class App {
  constructor() {
    this.screen = null;
  }

  launch() {
    // console.log(this.screen);
    this.screen = window.open("./screen.html");
    this.buildUI();
  }

  buildUI() {}
}

let app = null;
window.addEventListener("load", () => {
  app = new App();
  document.querySelector(".launch").addEventListener("click", () => {
    app.launch();
  });
});
