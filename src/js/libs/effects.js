import { Effects } from "../effects.js";

export class Effect {
	constructor(idx, effect, onSelect, onChange) {
		this.idx = idx;
		this.selected = effect;

		this.onChange = (effect, evt) => {
			onChange(idx, effect);

			this.setSelected(effect);
		};

		this.onSelect = (effect, evt) => {
			onSelect(idx, effect);

			let previous = document.querySelector(".select.selected");
			if (!!previous) {
				previous.classList.remove("selected");
			}
			this.el.classList.add("selected");
			this.el.focus();
		};

		this.toggleActive = (e) => {
			e.preventDefault();
			e.stopPropagation();

			this.el.classList.add("active");

			window.addEventListener("click", () => {
				this.el.classList.remove("active");
			});
		};

		this.setSelected = (effect) => {
			console.log(effect);

			this.selected = Effects.find((ef) => ef.id === effect);
			this.el.querySelector(".select-display").innerText =
				this.selected?.label || "No Effect";
		};

		this.el = document.createElement("div");
		this.el.className = `select ${idx === 0 ? "selected" : ""}`;
		this.el.tabIndex = 1;
		this.el.innerHTML = `
			<div class='effect'>
				<div class='select-display fx-clr-${idx}'>No Effect</div>
				<div class='select-list'>
					<ul class='uk-list'>
						<li data-value=''>No Effect</li>
					</ul>
				</div>
				<div class='select-handle'>
					<span uk-icon="icon: triangle-down"></span>
				</div>
			</div>
		`;

		this.el.querySelector("ul li").addEventListener("click", (evt) => {
			this.onChange("", evt);
		});

		Effects.map((e) => {
			let option = document.createElement("li");
			option.innerText = e.label;
			option.dataset.value = e.id;

			if (e.id === effect) {
				option.classList.add("selected");
			}

			option.addEventListener("click", (evt) => {
				this.onChange(e.id, evt);
			});

			this.el.querySelector("ul").appendChild(option);
		});

		this.el
			.querySelector(".select-handle")
			.addEventListener("click", this.toggleActive.bind(this));

		this.el
			.querySelector(".effect")
			.addEventListener("click", this.onSelect.bind(this));

		Object.defineProperty(this.el, "controller", { value: this });
	}
}
