import { spawn } from "child_process";

export class MultiPlayer {
	constructor(paths, onFrame) {
		this.paths = paths;

		// this.path = path;
		this.width = 1280;
		this.height = 720 * Object.keys(this.paths).length;

		this.onFrame = onFrame;
		this.buffer = new Uint8Array((this.width * this.height * 12) / 8);
		this.frame_size = (this.width * this.height * 12) / 8;
		this.buffer_size = (1280 * 720 * 12) / 8;
		this.byte_count = 0;
		this.frame = 0;
		this.ffmpeg = null;
		this.identity = new Uint8Array((1280 * 720 * 12) / 8).fill(0);
	}

	start() {
		let inputParams = ["-re", "-stream_loop", "-1"];
		let pathParams = this.paths.reduce((a, c) => {
			console.log(a, c);
			if (!!c) {
				a.push("-i");
				a.push(c);
			}

			return a;
		}, []);

		let outputParams = [
			"-f",
			"rawvideo",
			"-filter_complex",
			"vstack=inputs=6",
			"-preset",
			"ultrafast",
			"pipe:1",
		];

		console.log([...inputParams, ...pathParams, ...outputParams]);

		this.ffmpeg = spawn("ffmpeg", [
			...inputParams,
			...pathParams,
			...outputParams,
		]);

		this.ffmpeg.stdout.on("data", (data) => {
			let dataLen = data.length + this.byte_count;
			if (dataLen >= this.frame_size) {
				let split = data.length - (dataLen - this.frame_size);
				let rest = data.slice(0, split);
				let remainder = data.slice(split);
				this.buffer.set(rest, this.byte_count);

				let f = this.width * this.height;
				let q = (this.width >> 1) * (this.height >> 1);

				let yuv = {
					y: this.buffer.slice(0, f),
					u: this.buffer.slice(f, f + q),
					v: this.buffer.slice(f + q, f + q + q),
				};

				let frames = this.paths.map((path, idx) => {
					let frame;
					if (!path) {
						frame = new Uint8Array(this.identity);
					} else {
						let offset = idx * this.buffer_size;
						frame = this.buffer.slice(offset, offset + this.buffer_size);
					}

					let fi = 1280 * 720;
					let qi = (1280 >> 1) * (720 >> 1);

					return {
						y: yuv.y.slice(0, fi),
						u: yuv.u.slice(fi, fi + qi),
						v: yuv.v.slice(fi + qi, fi + qi + qi),
					};
				});

				this.onFrame(frames);

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
