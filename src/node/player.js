import { spawn } from "child_process";

export class Player {
	constructor(path, onFrame) {
		// TODO: read the video size;

		this.path = path;
		this.width = 1280;
		this.height = 720;
		this.onFrame = onFrame;
		this.buffer = new Uint8Array(1280 * 720 * 4);
		this.frame_size = 1280 * 720 * 4;
		this.byte_count = 0;
		this.frame = 0;
		this.ffmpeg = null;
	}

	start() {
		this.ffmpeg = spawn("ffmpeg", [
			"-re",
			"-stream_loop",
			"-1",
			"-i",
			this.path,
			"-f",
			"rawvideo",
			"-pix_fmt",
			"rgba",
			"-vf",
			"scale=1280:720",
			"-loglevel",
			"quiet",
			"pipe:1",
		]);

		this.ffmpeg.stdout.on("data", (data) => {
			let dataLen = data.length + this.byte_count;
			if (dataLen >= this.frame_size) {
				let split = data.length - (dataLen - this.frame_size);
				let rest = data.slice(0, split);
				let remainder = data.slice(split);

				this.buffer.set(rest, this.byte_count);

				this.onFrame(new Uint8Array(this.buffer));

				this.buffer.set(remainder, 0);
				this.byte_count = remainder.length;
				this.frame += 1;
			} else {
				this.buffer.set(data, this.byte_count);
				this.byte_count += data.length;
			}
		});

		this.ffmpeg.stderr.on("data", (data) => {
			console.error(`FFmpeg stderr: ${data}`);
		});

		this.ffmpeg.on("close", (code) => {
			console.log(`FFmpeg process exited with code ${code}`);
		});
	}

	stop() {
		if (this.ffmpeg !== null) {
			this.ffmpeg.stdin.end();
		}
	}
}
