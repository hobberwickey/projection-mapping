const effects = [
	{
		id: "default",
		label: "Video Controls",
		effect_a: "Opacity",
		effect_b: "Playback",
		effect_c: "Position",
	},
	{
		id: "cosine_pallet",
		label: "Cosine Pallet",
		effect_a: "Opacity",
		effect_b: "Intensity",
		effect_c: "Shift",
	},
	{
		id: "rgb_opacity",
		label: "RGB Opacity",
		effect_a: "R Opacity",
		effect_b: "B Opacity",
		effect_c: "G Opacity",
	},
	{
		id: "sine_distort",
		label: "Sine Distort",
		effect_a: "Opacity",
		effect_b: "Horizontal",
		effect_c: "Vertical",
	},
	{
		id: "prism",
		label: "Prism",
		effect_a: "Opacity",
		effect_b: "Horizontal",
		effect_c: "Vertical",
	},
	{
		id: "pixelate",
		label: "Pixelate",
		effect_a: "Opacity",
		effect_b: "Pallete Depth",
	},
];

export class Effect {
	constructor(idx) {
		this.idx = idx;

		this.onChange = (e) => {
			this.el.querySelector("video").src = URL.createObjectURL(
				e.target.files[0],
			);

			this.el.querySelector(".preview").classList.remove("no-video");
		};

		this.onSelect = (e) => {
			console.log(e);
		};

		this.el = document.createElement("div");
		this.el.className = "effect";
		this.el.innerHTML = `
			<ul class='uk-list'>
				<li>
					<select class='uk-select'>
						<option value=''>No Effect</option>
					</select>

					<div class='uk-flex uk-flex-inline'>
						<div class='effect-a'></div>
						<div class='effect-b'></div>
						<div class='effect-c'></div>
					</div>
				</li>
			</ul>
		`;

		effects.map((effect) => {
			let option = document.createElement("option");
			option.value = effect.label;
			option.innerText = effect.label;

			this.el.querySelector("select").appendChild(option);
			this.el
				.querySelector("select")
				.addEventListener("change", this.onChange.bind(this));
		});
	}
}
