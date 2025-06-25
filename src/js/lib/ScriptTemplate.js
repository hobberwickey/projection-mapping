export const ScriptTemplate = function (script) {
	return `
		const lfo = function(min, max, interval) {
			let ms = interval * 1000;
			let perc = (state.elapsed % ms) / ms;

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

		const getEffectById = function(id) {
			let effects = [];
			for (var i=0; i<state.effects.length; i++) {
				if (state.effects[i] === id) {
					effects.push(i);
				}
			}

			return effects;
		}

		const setEffectValues = function(effects, videos, x, y) {
			if (!Array.isArray(videos)) {
				videos = [videos];
			}

			if (!Array.isArray(effects)) {
				effects = [effects];
			}

			for (var i=0; i<videos.length; i++) {
				for (var j=0; j<effects.length; j++) {
					if (x !== null) {
						state.values.effects[videos[i]][effects[j]][0] = x;
					}

					if (y !== null) {
						state.values.effects[videos[i]][effects[j]][1] = y;
					}
				}
			}
		}

		const getEffectValues = function(effect, video) {
			return state.values.effects[video][effect];
		}

		const getSelectedVideo = function() {
			return state.selected.video;
		}

		const getSelectedEffect = function() {
			return state.selected.effect;
		}

		const getSelectedScript = function() {
			return state.selected.script;
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
	`;
};
