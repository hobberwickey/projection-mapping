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

		let led = leds.selected[2];
		let selected = state.selected.video;
		let value = selected === null ? 127 : selected;
		output.push([144, led, value]);

		let slot = state.selected.slot;
		if (slot > 5) {
			let slotLed = leds.selected[1];
			let slotValue = slot === null ? 127 : slot % 6;
			output.push([144, slotLed, slotValue]);
			output.push([144, leds.selected[0], 127]);
		} else {
			let slotLed = leds.selected[0];
			let slotValue = slot === null ? 127 : slot;
			output.push([144, slotLed, slotValue]);
			output.push([144, leds.selected[1], 127]);
		}

		// if (state.selected.slot !== null && state.selected.slot < 6) {
		// 	let values = state.values.effects[state.selected.video ?? 0];
		// 	for (var i = 0; i < values.length; i++) {
		// 		let led1 = leds.values[i * 2];
		// 		output.push([144, led1, (values[i][0] * 127) | 0]);

		// 		let led2 = leds.values[i * 2 + 1];
		// 		output.push([144, led2, (values[i][1] * 127) | 0]);
		// 	}
		// }

		// if (state.selected.slot !== null state.selected.slot > 5) {
		// 	let values = state.values.scripts;
		// 	for (var i = 0; i < values.length; i++) {
		// 		let led1 = leds.values[i * 2];
		// 		output.push([144, led1, (values[i][0] * 127) | 0]);

		// 		let led2 = leds.values[i * 2 + 1];
		// 		output.push([144, led2, (values[i][1] * 127) | 0]);
		// 	}
		// }

		let videoIdx = state.selected.video ?? 0;
		if (state.selected.slot !== null && state.selected.slot < 6) {
			for (var i = 0; i < 6; i++) {
				let slot = state.slots[i];
				let values = [0, 0];
				if (slot.effect === "__script") {
					values = slot.script.values;
				} else {
					values = slot.values[videoIdx];
				}

				output.push([144, leds.values[i * 2], (values[0] * 127) | 0]);
				output.push([144, leds.values[i * 2 + 1], (values[1] * 127) | 0]);
			}
		}

		if (state.selected.slot !== null && state.selected.slot > 5) {
			for (var i = 0; i < 6; i++) {
				let slot = state.slots[i + 6];
				let values = [0, 0];
				if (slot.effect === "__script") {
					values = slot.script.values;
				} else {
					values = slot.values[videoIdx];
				}

				output.push([144, leds.values[i * 2], (values[0] * 127) | 0]);
				output.push([144, leds.values[i * 2 + 1], (values[1] * 127) | 0]);
			}
		}

		// debounce(() => {

		for (let i = 0; i < output.length; i++) {
			this.output.send(output[i]);
		}

		// }, 100);
	}
}
