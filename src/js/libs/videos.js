export class Video {
	constructor(idx, video, onChange, onSelect, onDelete) {
		this.onChange = (e) => {
			if (e.target.files.length > 0) {
				this.el.querySelector("video").src = URL.createObjectURL(
					e.target.files[0],
				);

				this.el.querySelector("video").currentTime = 50;
				this.el.querySelector(".preview").classList.remove("no-video");
			}

			onChange(idx, video, e.target.files[0]);
		};

		this.onSelect = (e) => {
			document.querySelector(".video.selected").classList.remove("selected");
			this.el.classList.add("selected");
			onSelect(idx);
		};

		this.onDelete = () => {
			this.el.querySelector("video").src = "";

			onDelete(idx);
		};

		this.el = document.createElement("div");
		this.el.className = `video uk-card uk-card-small uk-card-default`;
		this.el.innerHTML = `
			<div>
				<div class='left'>
					<div id='video-${video.id}' class="uk-card-header">
						<label for='video-${idx}'>
							<input id='video-${idx}' type='radio' name='video' class='uk-radio' />	
							<input type='text' class="uk-card-title" value='${video.label}' />
						</label
						><a class='remove-video' href="javascript:void(0)" uk-icon="icon: trash"></a>
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

		this.el.addEventListener("click", this.onSelect.bind(this));

		this.el
			.querySelector(".upload-wrapper input")
			.addEventListener("change", this.onChange.bind(this));

		this.el
			.querySelector("input[type='radio']")
			.addEventListener("change", this.onSelect.bind(this));

		this.el
			.querySelector(".remove-video")
			.addEventListener("click", this.onDelete.bind(this));

		Object.defineProperty(this.el, "controller", this);
	}
}
