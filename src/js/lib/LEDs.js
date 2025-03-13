import { Config } from "./Config.js";
import { debounce } from "./Utils.js";

export class LEDs extends Context {
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
		let { leds } = midi;

		let output = [];
		for (let i = 0; i < state.videos.length; i++) {
			let led = leds.opacity[i];
			let opacity = state.videos[i].opacity;

			output.push([144, led, (opacity * 127) | 0]);
		}

		let keyIndexes = { script: 0, effect: 1, video: 2 };
		for (let key in state.selected) {
			let led = leds.selected[keyIndexes[key]];
			let selected = state.selected[key];
			let value = selected === null ? 127 : selected;

			output.push([144, led, value]);
		}

		if (state.selected.effect !== null) {
			let values = state.values.effects[state.selected.video ?? 0];

			for (var i = 0; i < values.length; i++) {
				let led1 = leds.values[i * 2];
				output.push([144, led1, (values[i][0] * 127) | 0]);

				let led2 = leds.values[i * 2 + 1];
				output.push([144, led2, (values[i][1] * 127) | 0]);
			}
		}

		debounce(() => {
			for (let i = 0; i < output.length; i++) {
				this.output.send(output[i]);
			}
		}, 100);
	}
}
