export class Storage {
  constructor(context) {
    this.context = context;
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
    document.querySelector("#save_btn").classList.add("saved");
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
    this.setEffectValues();
    this.setValues();

    for (var i = 0; i < this.config.video_count; i++) {
      this.removeVideo(i);
    }

    document.querySelectorAll(".table .column.shape").forEach((col) => {
      col.parentNode.removeChild(col);
    });

    document.querySelectorAll(".table .column.groups .group").forEach((grp) => {
      grp.parentNode.removeChild(grp);
    });

    this.setupGroups();

    document.querySelector("#save_btn").classList.add("saved");
    document.querySelector("#project_name").value = this.name;
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
    let projects = this.getProjects();

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
        self.updateProjectList();
      };

      reader.readAsText(file);
    }
  }

  saveState() {
    localStorage.setItem("auto", JSON.stringify(this.state));
    document.querySelector("#save_btn").classList.remove("saved");
  }

  resetState() {
    for (var i = 0; i < this.config.video_count; i++) {
      this.removeVideo(i);
    }

    this.context.state = this.defaultState();

    if (this.screen !== null) {
      this.screen.postMessage(
        JSON.stringify({
          action: "update_state",
          state: this.context.state,
        }),
      );
    }
  }
}
