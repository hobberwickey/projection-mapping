export const Config = {
	default: {
		video_count: 6,
		effect_count: 6,
		group_count: 6,
		script_count: 6,
		effect_parameter_count: 2,

		midi: {
			leds: {
				selected: [50, 51, 52], //script, effect, video,
				opacity: [56, 57, 58, 59, 60, 61],
				values: [62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
			},
			buttons: {
				select: [0, 1, 2, 3, 4, 5],
				opacity: [10, 11, 12, 13, 14, 15],
			},

			selectors: {
				click: [20, 21],
				select: [31, 32],
			},

			sliders: [
				[40, 41],
				[42, 43],
			],
		},
	},
};
