import { Player } from "./player.js";
import { Output } from "./output.js";
import { defaultState } from "./state.js";

import webgl from "webgl-raub";
import raub from "glfw-raub";

const { Document } = raub;
const state = defaultState();

Document.setWebgl(webgl); // plug this WebGL impl into the Document

const doc = new Document();

const canvas = doc.createElement("canvas"); // === doc
const gl = canvas.getContext("webgl");

const output = new Output(gl, state);

const loop = () => {
	output.step();

	setTimeout(() => {
		doc.requestAnimationFrame(loop);
	}, 41);
};

loop();

// doc.loop(() => {
// 	// output.step();
// });

output.loadVideo("/Users/Joel/Downloads/slugs.mp4", 0);
// output.loadVideo("/Users/Joel/Downloads/slugs.mp4", 1);
// output.loadVideo("/Users/Joel/Downloads/slugs.mp4", 2);
// output.loadVideo("/Users/Joel/Downloads/slugs.mp4", 3);
// output.loadVideo("/Users/Joel/Downloads/slugs.mp4", 4);
// output.loadVideo("/Users/Joel/Downloads/slugs.mp4", 5);

// output.loadVideo("./public/videos/pika.mp4", 0);
output.loadVideo("./public/videos/ink.mp4", 1);
output.loadVideo("./public/videos/kelp.mp4", 2);
output.loadVideo("./public/videos/pines.mp4", 3);
output.loadVideo("./public/videos/trippy.mp4", 4);
output.loadVideo("./public/videos/lines.mp4", 5);

// output.setEffect(0, "pixelate");
// output.setEffect(1, "cosine_palette");
