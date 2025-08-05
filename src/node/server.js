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

let start = Date.now();
const loop = () => {
	try {
		output.step();
	} catch (e) {
		console.log(e);
	}

	let diff = new Date() - start;
	setTimeout(() => {
		start = Date.now();
		doc.requestAnimationFrame(loop);
	}, 41 - diff);
};

loop();

output.loadVideos([
	"./public/videos/pika.mp4",
	"./public/videos/pika.mp4",
	"./public/videos/pika.mp4",
	"./public/videos/pika.mp4",
	"./public/videos/pika.mp4",
	"./public/videos/pika.mp4",
]);
// output.loadVideo("./public/videos/ink.mp4", 1);
// output.loadVideo("./public/videos/ink.mp4", 2);
// output.loadVideo("./public/videos/ink.mp4", 3);
// output.loadVideo("./public/videos/ink.mp4", 4);
// output.loadVideo("./public/videos/ink.mp4", 5);

// output.setEffect(0, "pixelate");
// output.setEffect(1, "prism");
// output.setEffect(2, "cosine_palette");
// output.setEffect(0, "shift");
