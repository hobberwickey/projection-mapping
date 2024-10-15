export class Video {
	constructor(idx, onChange, onEffect, onSelect) {
		this.idx = idx;

		this.onChange = (e) => {
			this.el.querySelector("video").src = URL.createObjectURL(
				e.target.files[0],
			);

			this.el.querySelector("video").currentTime = 50;
			this.el.querySelector(".preview").classList.remove("no-video");

			onChange(idx, e.target.files[0]);
		};

		this.onEffect = (effect, e) => {
			onEffect(idx, effect, e.target.value);
		};

		this.onSelect = (e) => {
			console.log(e);
		};

		this.el = document.createElement("div");
		this.el.className = "video uk-card uk-card-small uk-card-default";
		this.el.innerHTML = `
			<div>
				<div class='left'>
					<div id='video-${this.idx}' class="uk-card-header">
		        <input type='text' class="uk-card-title" value='Video ${this.idx + 1}'></input>
		    	</div>
					<div class="uk-card-body">
						<div class='preview no-video'>
							<video></video>
							<p>
								No Video
							</p>
						</div>
						<div class='upload-wrapper'>
							<label class='uk-label' for='video-${this.idx}-input'>Upload</label>
							<input id='video-${this.idx}-input' type='file' />
						</div>
					</div>
				</div>
				<div class='right'>
					<div class='inputs'>
						<input type='range' min="0" max="1" step="0.01" value="0" class='uk-range effect-a' />
						<input type='range' min="0" max="1" step="0.01" value="0" class='uk-range effect-b' />
						<input type='range' min="0" max="1" step="0.01" value="0" class='uk-range effect-c' />
					</div>
				</div>
			</div>
		`;

		this.el
			.querySelector(".upload-wrapper input")
			.addEventListener("change", this.onChange.bind(this));

		this.el
			.querySelector(".effect-a")
			.addEventListener("input", this.onEffect.bind(this, "effect_a"));

		this.el
			.querySelector(".effect-b")
			.addEventListener("input", this.onEffect.bind(this, "effect_b"));

		this.el
			.querySelector(".effect-c")
			.addEventListener("input", this.onEffect.bind(this, "effect_c"));
	}
}
