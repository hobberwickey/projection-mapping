export class Shapes {
	constructor(idx) {
		this.updateLabel = (e) => {
			console.log(idx, e.target.value);
		};

		this.el = document.createElement("th");
		this.el.innerHTML = `
			<div>
				<input type='text' value="${idx === 0 ? "All" : "Group " + idx}" />
			</div>
		`;

		this.el
			.querySelector("input")
			.addEventListener("input", this.updateLabel.bind(this));
	}
}

export class Triangle {
	constructor(idx) {
		this.updateLabel = (e) => {
			console.log(idx, e.target.value);
		};

		this.el = document.createElement("td");
		this.el.innerHTML = `
			<input type='text' value="Triangle ${idx + 1}" />
		`;

		this.el
			.querySelector("input")
			.addEventListener("input", this.updateLabel.bind(this));
	}
}

export class Group {
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

		this.el
			.querySelector("input")
			.addEventListener("input", this.toggleGroup.bind(this));
	}
}
