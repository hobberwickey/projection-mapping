export class Video {
	constructor(video, onChange, onEffect, onSelect) {
		this.onChange = (e) => {
			this.el.querySelector("video").src = URL.createObjectURL(
				e.target.files[0],
			);

			this.el.querySelector("video").currentTime = 50;
			this.el.querySelector(".preview").classList.remove("no-video");

			onChange(video, e.target.files[0]);
		};

		this.onEffect = (effect, e) => {
			onEffect(video, effect, e.target.value);
		};

		this.onSelect = (e) => {
			console.log(e);
		};

		this.el = document.createElement("div");
		this.el.className = "video uk-card uk-card-small uk-card-default";
		this.el.innerHTML = `
			<div>
				<div class='left'>
					<div id='video-${video.id}' class="uk-card-header">
						<input type='radio' name='video' class='uk-radio' 
		        /><input type='text' class="uk-card-title" value='${video.label}'></input>
		    	</div>
					<div class="uk-card-body">
						<div class='preview no-video upload-wrapper'>
							<video></video>
							<p>
								No Video
							</p>
							<label class='uk-label' for='video-${video.id}-input'></label>
							<input id='video-${video.id}-input' type='file' />
						</div>
					</div>
				</div>
				
			</div>
		`;

		this.el
			.querySelector(".upload-wrapper input")
			.addEventListener("change", this.onChange.bind(this));

		// this.el
		// 	.querySelector(".opacity")
		// 	.addEventListener("input", this.onEffect.bind(this, "opacity"));

		// this.el
		// 	.querySelector(".effect-b")
		// 	.addEventListener("input", this.onEffect.bind(this, "effect_b"));

		// this.el
		// 	.querySelector(".effect-c")
		// 	.addEventListener("input", this.onEffect.bind(this, "effect_c"));
	}
}
