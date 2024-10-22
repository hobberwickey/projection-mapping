export class Video {
	constructor(idx, video, onChange, onSelect) {
		this.onChange = (e) => {
			this.el.querySelector("video").src = URL.createObjectURL(
				e.target.files[0],
			);

			this.el.querySelector("video").currentTime = 50;
			this.el.querySelector(".preview").classList.remove("no-video");

			onChange(idx, video, e.target.files[0]);
		};

		this.onSelect = (e) => {
			onSelect(idx);
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
							<input id='video-${video.id}-input' type='file' accept="video/mp4,video/x-m4v,video/*" />
						</div>
					</div>
				</div>
			</div>
		`;

		this.el
			.querySelector(".upload-wrapper input")
			.addEventListener("change", this.onChange.bind(this));

		this.el
			.querySelector("input[type='radio']")
			.addEventListener("change", this.onSelect.bind(this));
	}
}
