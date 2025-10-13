export const ScriptTemplate = function (script) {
	return `
		// Keep track of the percs for each lfo initiated
		let lfos = registry[script_id] || [];
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

		const setValues = function(identifier, videos, values) {
			let current = getValues(identifier);
			let x = values[0];
			let y = values[0];

			if (!Array.isArray(videos)) {
				videos = [videos];
			}

			for (let i=0; i<current.length; i++) {
				let set = current[i];

				for (let j=0; j<videos.length; j++) {
					if (x !== null) {
						set[j][0] = x;
					}

					if (y !== null) {
						set[j][1] = y;
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

		${script}

		return lfos;
	`;
};
