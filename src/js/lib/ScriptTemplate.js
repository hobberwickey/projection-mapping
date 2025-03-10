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

		const setShapeOpacity  = function(shapes, videos, opacity)  {
			if (!Array.isArray(shapes)) {
				shapes = [shapes];
			}

			if (!Array.isArray(videos)) {
				videos = [videos];
			}

			for (let i=0; i<shapes.length; i++) {
				let shape = state.shapes[i];

				for (var j=0; j<videos.length; j++) {
					let video = videos[j];

					shape.opacity[video] = opacity;
				}
			}
		}

		const setInputPoints = function(shapes, fn) {
			if (!Array.isArray(shapes)) {
				shapes = [shapes];
			}

			for (let i=0; i<shapes.length; i++) {
				let shape = state.shapes[i];

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
				let shape = state.shapes[i];

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
