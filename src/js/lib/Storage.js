export class Storage extends Context {
  constructor(app) {
    super({
      saved: false,
      projects: JSON.parse(localStorage.getItem("projects")) || [],
      scripts: JSON.parse(localStorage.getItem("scripts")) || [],
    });

    this.app = app;
  }

  save(id, name, state) {
    let { projects } = this;
    let idx = projects.findIndex((p) => p.id === id);

    if (idx === -1) {
      projects.push({
        id: id,
        name: name,
        state: JSON.parse(JSON.stringify(state)),
      });
    } else {
      projects.splice(idx, 1, {
        id: id,
        name: name,
        state: JSON.parse(JSON.stringify(state)),
      });
    }

    this.projects = [...projects];
    this.saved = true;

    localStorage.setItem("projects", JSON.stringify(projects));
  }

  load(project) {
    let { app } = this;
    let { id, name, state } = project;

    if (!state.shapes[0]?.tris) {
      console.log("Old format, can't load");
      return;
    }

    app.id = id;
    app.name = name;
    app.state = JSON.parse(JSON.stringify(state));

    app.setEffectValues();
    app.setValues();

    for (var i = 0; i < this.app.config.video_count; i++) {
      app.removeVideo(i);
    }
  }

  deleteProject(project) {
    let { projects } = this;

    let idx = projects.findIndex((p) => p.id === project.id);
    console.log(idx);
    if (idx !== -1) {
      let project = projects[idx];
      projects.splice(idx, 1);

      if (project.id === this.app.id) {
        this.resetState();
      }
    }

    this.projects = [...projects];
    localStorage.setItem("projects", JSON.stringify(projects));
  }

  downloadProjects() {
    let { projects } = this;
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
    let { projects } = this;

    if (e.target.files.length > 0) {
      let file = e.target.files[0];
      let reader = new FileReader();
      let self = this;

      reader.onload = function () {
        let loaded = JSON.parse(reader.result);

        (loaded || []).map((project) => {
          let existingIdx = projects.findIndex((p) => p.id === project.id);

          if (existingIdx === -1) {
            projects.push(project);
          } else {
            // TODO: Implement
            console.log("Project already exists, confirm overwrite");
          }
        });

        localStorage.setItem("projects", JSON.stringify(projects));
        self.projects = [...projects];
      };

      reader.readAsText(file);
    }
  }

  downloadScripts() {
    let scripts = JSON.parse(localStorage.getItem("scripts")) || [];
    scripts.map((script) => {
      if (!script.id) {
        script.id = (Math.random() * 1000000) | 0;
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

  uploadScripts() {
    let scripts = JSON.parse(localStorage.getItem("scripts")) || [];

    if (e.target.files.length > 0) {
      let file = e.target.files[0];
      let reader = new FileReader();
      let self = this;

      reader.onload = function () {
        let loaded = JSON.parse(reader.result);

        (loaded || []).map((script) => {
          let existingIdx = scripts.findIndex((s) => s.id === script.id);

          if (existingIdx === -1) {
            scripts.push(script);
          } else {
            // TODO: Implement
            console.log("Project already exists, confirm overwrite");
          }
        });

        localStorage.setItem("scripts", JSON.stringify(scripts));
      };

      reader.readAsText(file);
    }
  }

  saveState() {
    // localStorage.setItem("auto", JSON.stringify(this.state));
    // document.querySelector("#save_btn").classList.remove("saved");
  }

  resetState() {
    for (var i = 0; i < this.app.config.video_count; i++) {
      this.app.removeVideo(i);
    }

    this.app.state = this.app.defaultState();

    if (this.app.screen !== null) {
      this.app.screen.postMessage(
        JSON.stringify({
          action: "update_state",
          state: this.app.state,
        }),
      );
    }
  }
}
