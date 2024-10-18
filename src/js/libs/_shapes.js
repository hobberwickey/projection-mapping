export class Shape {
	constructor(idx, shape, onSelect, onUpdate) {
		this.onUpdate = (e) => {
			console.log(idx, shape.id, e.target.value);
		};

		this.onSelect = (e) => {
			console.log(idx, shape.id, e.target.value);
		};

		this.el = document.createElement("th");
		this.el.innerHTML = `
			<div>
				<input type='radio' name='group' class='uk-radio' 
				/><input type='text' value="${shape.label}" />
			</div>
		`;

		this.el
			.querySelector("input")
			.addEventListener("input", this.onUpdate.bind(this));
	}
}

export class Group {
	constructor(idx, group) {
		this.onUpdate = (e) => {
			console.log(idx, group.id, e.target.value);
		};

		this.onSelect = (e) => {
			console.log(idx, group.id, e.target.value);
		};

		this.el = document.createElement("td");
		this.el.innerHTML = `
			<div>
				<div class='selector'></div>
				<input type='text' value="${group.label}" />
			
			</div>
		`;

		this.el
			.querySelector("input")
			.addEventListener("input", this.onUpdate.bind(this));
	}
}

export class GroupToggle {
	constructor(group, shape) {
		this.toggleGroup = () => {
			console.log(shape.id, group.id);
		};

		this.el = document.createElement("td");
		if (group.editable) {
			this.el.innerHTML = `
				<input class='uk-checkbox' type='checkbox' value="${group.id}"  />
			`;
		} else {
			this.el.innerHTML = `
				<div>
					<input class='uk-checkbox' type='checkbox' checked disabled value="${group.id}"  />
				</div>
			`;
		}

		this.el
			.querySelector("input")
			.addEventListener("input", this.toggleGroup.bind(this));
	}
}
