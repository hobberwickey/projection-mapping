export class Shape {
	constructor(idx, shape, onSelect, onUpdate) {
		this.onUpdate = (e) => {
			console.log(idx, shape.id, e.target.value);
		};

		this.onSelect = (e) => {
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

		this.el
			.querySelector("input")
			.addEventListener("input", this.onUpdate.bind(this));
	}
}

export class Group {
	constructor(idx, group, onSelect) {
		this.onUpdate = (e) => {
			console.log(idx, group.id, e.target.value);
		};

		this.onSelect = (e) => {
			onSelect(idx);

			let prev = document.querySelector(".group .selected");
			if (prev !== null) {
				prev.classList.remove("selected");
			}

			this.el.querySelector(".group-btn").classList.add("selected");
		};

		this.el = document.createElement("div");
		this.el.className = `row group grp-clr-${idx}`;
		this.el.innerHTML = `
			<div class='group-btn ${idx === 0 ? "selected" : ""}'>
				<label for='group-${idx}'>
					<input type='text' value="${group.label}" />
					<input id='group-${idx}' class='uk-radio' name='group' type='radio' value="${group.id}"  />
				</label>
			</div>
		`;

		this.el.addEventListener("click", this.onSelect.bind(this));

		this.el
			.querySelector("input[type='text']")
			.addEventListener("input", this.onUpdate.bind(this));

		this.el
			.querySelector("input[type='radio']")
			.addEventListener("input", this.onSelect.bind(this));
	}
}

export class GroupToggle {
	constructor(groupIdx, shapeIdx, onToggle) {
		this.toggleGroup = () => {
			onToggle(shapeIdx, groupIdx);
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

		this.el
			.querySelector("input")
			.addEventListener("input", this.toggleGroup.bind(this));
	}
}
