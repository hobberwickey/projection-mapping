const effects = [
	{
		id: "default",
		label: "Video Controls",
		opacity: "Opacity",
		effect_a: "Playback",
		effect_b: "Position",
	},
	{
		id: "cosine_pallet",
		label: "Cosine Pallet",
		opacity: "Opacity",
		effect_a: "Intensity",
		effect_b: "Shift",
	},
	{
		id: "rgb_opacity",
		label: "RGB Opacity",
		opacity: "R Opacity",
		effect_a: "B Opacity",
		effect_b: "G Opacity",
	},
	{
		id: "sine_distort",
		label: "Sine Distort",
		opacity: "Opacity",
		effect_a: "Horizontal",
		effect_b: "Vertical",
	},
	{
		id: "prism",
		label: "Prism",
		opacity: "Opacity",
		effect_a: "Horizontal",
		effect_b: "Vertical",
	},
	{
		id: "pixelate",
		label: "Pixelate",
		opacity: "Opacity",
		effect_a: "Pixel Size",
		effect_b: "Pallete Depth",
	},
];

export class Effect {
	constructor(idx, effect, onSelect, onChange) {
		this.idx = idx;

		this.onChange = (e) => {
			console.log(idx, effect, e.target.value);
			onChange(idx, e.target.value);
		};

		this.onSelect = (e) => {
			console.log(idx, effect);
			onSelect(idx);
		};

		this.el = document.createElement("div");
		this.el.className = "effect";
		this.el.innerHTML = `
			<ul class='uk-list fx-clr-${idx}'>
				<li>
					<div>
						<input name='effect' class='uk-radio' type='radio' value='${effect}' 
						/><label>
							<select class='uk-select'>
								<option value=''>No Effect</option>
							</select>
						</label>
					</div>
				</li>
			</ul>
		`;

		effects.map((e) => {
			let option = document.createElement("option");
			option.value = e.id;
			option.innerText = e.label;
			option.selected = e.id === effect;

			this.el.querySelector("select").appendChild(option);
		});

		this.el
			.querySelector("select")
			.addEventListener("change", this.onChange.bind(this));

		this.el
			.querySelector("input")
			.addEventListener("change", this.onSelect.bind(this));
	}
}
