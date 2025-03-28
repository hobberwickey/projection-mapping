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

			let slider1 = sliders[1][0];
			output.push([144, slider1, (values[0] * 127) | 0]);

			let slider2 = sliders[1][1];
			output.push([144, slider2, (values[1] * 127) | 0]);
		}

		debounce(() => {
			for (let i = 0; i < output.length; i++) {
				this.output.send(output[i]);
			}
		}, 100);
	}
}
