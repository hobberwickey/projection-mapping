export const ScriptTemplate = function (script) {
	return `
		// Keep track of the percs for each lfo initiated
		if (!registry[script_id]) {
			registry[script_id] = {};
		}

		registry[script_id].lfos = registry[script_id].lfos || [];
		registry[script_id].beats = registry[script_id].beats || {};

		let lfos = registry[script_id].lfos;
		let lfos_count = 0;

		const lfo = function(min, max, interval) {
			let ms = interval * 1000;
			let previous = lfos[lfos_count] || 1;
			let delta = Math.abs(((state.elapsed % ms) / ms) - ((registry.elapsed % ms) / ms));
			let perc = (previous + delta) % 1;

			lfos[lfos_count] = perc || 0;
			lfos_count++;

			return {
				sin: function() {
					return (
			      min +
			      (1 + Math.sin((perc * 360 * Math.PI) / 180)) * ((max - min) / 2)
			    );
				},
				cos: function() {
					return (
			      min +
			      (1 + Math.cos((perc * 360 * Math.PI) / 180)) * ((max - min) / 2)
			    );
				},
				tri: function() {
					return Math.abs(perc - 0.5) * (max - min) * 2 + min;
				},
				saw: function() {
					return perc * (max - min) + min;
				},
				square: function() {
					return Math.round(perc) * (max - min) + min;
				},
				noise: function() {
					return Math.floor(Math.random() * (max - min + 1)) + min;
				}
			}
		}

		const onBeats = function(beats, on, off) {
			let beat_id = ''
			for (var i=0; i<beats.length; i++) {
				beat_id = beat_id + beats[i][0] + "." + beats[i][1];
			}
			let current = registry[script_id].beats[beat_id];
			if (state.beat !== null) {
				let match = beats.find((beat) => {
					let match1 = beat[0] === state.beat[0] || beat[0] === "*";
					let match2 = beat[1] === state.beat[1] || beat[1] === "*";
					
					return match1 && match2;
				})

				if (match) {
		      registry[script_id].beats[beat_id] = on(state.beat, current);
				}
			} else {
				if (!!off) {
					registry[script_id].beats[beat_id] = off(state.beat, current);
				}
			}

			return registry[script_id].beats[beat_id];
		}

		// Deprecated
		const smooth_lfo = function(min, max, interval) {
			let ms = interval * 1000;
			let previous = lfos[lfos_count] || 1;
			let delta = Math.abs(((state.elapsed % ms) / ms) - ((registry.elapsed % ms) / ms));
			let perc = (previous + delta) % 1;

			lfos[lfos_count] = perc || 0;
			lfos_count++;

			return {
				sin: function() {
					return (
			      min +
			      (1 + Math.sin((perc * 360 * Math.PI) / 180)) * ((max - min) / 2)
			    );
				},
				cos: function() {
					return (
			      min +
			      (1 + Math.cos((perc * 360 * Math.PI) / 180)) * ((max - min) / 2)
			    );
				},
				tri: function() {
					return Math.abs(perc - 0.5) * (max - min) * 2 + min;
				},
				saw: function() {
					return perc * (max - min) + min;
				},
				square: function() {
					return Math.round(perc) * (max - min) + min;
				},
				noise: function() {
					return Math.floor(Math.random() * (max - min + 1)) + min;
				}
			}
		}

		const setVideoOpacity = function(videos, opacity) {
			if (!Array.isArray(videos)) {
				videos = [videos];
			}

			for (let i=0; i<videos.length; i++) {
				let video = videos[i];

				for (var j=0; j<state.shapes.length; j++) {
					let shape = state.shapes[j];
					shape.opacity[video] = opacity;
				}
			}
		}

		const getVideoOpacity = function(video) {
			return state.videos[video].opacity;
		}

		const setShapeOpacity = function(shapes, videos, opacity)  {
			if (!Array.isArray(shapes)) {
				shapes = [shapes];
			}

			if (!Array.isArray(videos)) {
				videos = [videos];
			}

			for (let i=0; i<shapes.length; i++) {
				let shape = state.shapes[shapes[i]];

				for (var j=0; j<videos.length; j++) {
					let video = videos[j];

					shape.opacity[video] = opacity;
				}
			}
		}

		const getShapeOpacity = function(shape, video) {
			return state.shapes[shape].opacity[video];
		}

		const getValues = function(identifier) {
			if (typeof identifier === 'number') {
				if (state.slots[identifier].effect === "__script") {
					return [state.slots[identifier].script.values]
				}

				return [state.slots[identifier].values];
			}

			let values = [];
			for (let i=0; i<state.scripts.length; i++) {
				if (state.scripts[i].slot.label.toLowerCase() === identifier.toLowerCase()) {
					values.push(state.scripts[i].slot.script.values);
				}
			}

			for (let i=0; i<state.effects.length; i++) {
				if (state.effects[i].slot.label.toLowerCase() === identifier.toLowerCase()) {
					values.push(state.effects[i].slot.values);
				}
			}	

			return values;
		}

		const setValues = function(identifier, videos, x, y) {
			let current = getValues(identifier);

			if (!Array.isArray(videos)) {
				videos = [videos];
			}

			for (let i=0; i<current.length; i++) {
				let set = current[i];

				for (let j=0; j<videos.length; j++) {
					if (x !== null) {
						set[j][0] = Math.max(0, Math.min(1, x || 0));
					}

					if (y !== null) {
						set[j][1] = Math.max(0, Math.min(1, y || 0));;
					} 
				}
			}
		}

		// Deprecated
		const getEffectById = function(id) {
			return [];
		}

		// Deprecated
		const setEffectValues = function(effects, videos, x, y) {
			return;
		}

		// Deprecated
		const getEffectValues = function(effect, video) {
			return [0, 0];
		}

		const getSelectedVideo = function() {
			return state.selected.video;
		}

		const getSelectedSlot = function() {
			return state.selected.slot;
		}

		// Deprecated
		const getSelectedEffect = function() {
			return state.selected.slot;
		}

		// Deprecated
		const getSelectedScript = function() {
			return state.selected.slot;
		}

		const setInputPoints = function(shapes, fn) {
			if (!Array.isArray(shapes)) {
				shapes = [shapes];
			}

			for (let i=0; i<shapes.length; i++) {
				let shape = state.shapes[shapes[i]];

				if (!shape) {
					continue;
				}

				if (shape.type === "triangle") {
					fn(0, [shape.tris[0].input[0]])
					fn(1, [shape.tris[0].input[1]])
					fn(2, [shape.tris[0].input[2]])
				} else if (shape.type === "quad") {
					fn(0, [shape.tris[0].input[0], shape.tris[1].input[0]])
					fn(1, [shape.tris[0].input[1]])
					fn(2, [shape.tris[0].input[2], shape.tris[1].input[1]])
					fn(3, [shape.tris[1].input[2]])
				}
			}
		}

		const setOutputPoints = function(shapes, fn) {
			if (!Array.isArray(shapes)) {
				shapes = [shapes];
			}

			for (let i=0; i<shapes.length; i++) {
				let shape = state.shapes[shapes[i]];
				
				if (!shape) {
					continue;
				}

				if (shape.type === "triangle") {
					fn(0, [shape.tris[0].output[0]])
					fn(1, [shape.tris[0].output[1]])
					fn(2, [shape.tris[0].output[2]])
				} else if (shape.type === "quad") {
					fn(0, [shape.tris[0].output[0], shape.tris[1].output[0]])
					fn(1, [shape.tris[0].output[1]])
					fn(2, [shape.tris[0].output[2], shape.tris[1].output[1]])
					fn(3, [shape.tris[1].output[2]])
				}
			}
		}

		const createShape = function(inputs, outputs, opacity) {
			opacity = opacity || 0;

			if (!Array.isArray(inputs) || !Array.isArray(outputs)) {
				return
			}

			if (inputs.length !== outputs.length) {
				return 
			}

			for (let i=0; i<inputs.length; i++) {
				inputs[i][0] = Math.max(0, Math.min(1, inputs[i][0]))
				inputs[i][1] = Math.max(0, Math.min(1, inputs[i][1]))
				outputs[i][0] = Math.max(0, Math.min(1, outputs[i][0]))
				outputs[i][1] = Math.max(0, Math.min(1, outputs[i][1]))
			}

			let shape = {
				id: "",
        type: inputs.length === 3 ? 'triangle' : 'quad',
        label: "",
        opacity: new Array(state.videos.length).fill(opacity),
			};

			if (inputs.length === 3) {
				shape.tris = [	
					{input: [
						[inputs[0][0], inputs[0][1]],
						[inputs[1][0], inputs[1][1]],
						[inputs[2][0], inputs[2][1]],
					],
					output: [
						[outputs[0][0], outputs[0][1]],
						[outputs[1][0], outputs[1][1]],
						[outputs[2][0], outputs[2][1]],
					]}
				]
			} else if (inputs.length === 4) {
				shape.tris = [
					{input: [
						[inputs[0][0], inputs[0][1]],
						[inputs[1][0], inputs[1][1]],
						[inputs[2][0], inputs[2][1]],
					],
					output: [
						[outputs[0][0], outputs[0][1]],
						[outputs[1][0], outputs[1][1]],
						[outputs[2][0], outputs[2][1]],
					]},
					{input: [
						[inputs[0][0], inputs[0][1]],
						[inputs[2][0], inputs[2][1]],
						[inputs[3][0], inputs[3][1]],
					],
					output: [
						[outputs[0][0], outputs[0][1]],
						[outputs[2][0], outputs[2][1]],
						[outputs[3][0], outputs[3][1]],
					]}
				]
			} else {
				return
			}

			state.shapes.push(shape);

			return shape;
		}

		${script}

		return lfos;
	`;
};
