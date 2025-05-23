import { Config } from "./Config.js";
import { debounce } from "./Utils.js";

export class Sliders extends Context {
	constructor(state, config, output, input) {
		super({
			state: state,
			config: config,
		});

		this.output = output;
		this.input = input;

		this.output_paused = null;
		this.input_paused = null;
	}

	pauseOut(fn) {
		clearTimeout(this.output_paused);
		this.output_paused = setTimeout(() => {
			if (!!fn) {
				fn();
			}

			this.output_paused = null;
		}, 100);
	}

	pauseIn(fn) {
		clearTimeout(this.input_paused);
		this.input_paused = setTimeout(() => {
			if (!!fn) {
				fn();
			}

			this.input_paused = null;
		}, 100);
	}

	updateConfig(config) {
		this.config = config;
	}

	updateState(state) {
		this.state = state;

		if (!this.output) {
			return;
		}

		let { midi } = this.config;
		let { sliders } = midi;

		let output = [];
		if (state.selected.effect !== null) {
			let values =
				state.values.effects[state.selected.video ?? 0][state.selected.effect];

			for (let i = 0; i < 2; i++) {
				let slider1 = sliders[i][0];
				output.push([144, slider1, (values[0] * 127) | 0]);

				let slider2 = sliders[i][1];
				output.push([144, slider2, (values[1] * 127) | 0]);
			}
		}

		if (this.output_paused === null) {
			for (let i = 0; i < output.length; i++) {
				this.output.send(output[i]);
			}
		}
	}
}
