import frameGenerator from "./scr/frames-generator.js";
import config from "./config.json" assert { type: "json" };

const generator = frameGenerator(config.framesPreferences);

const main = async () => {
	await generator.generate();
}

main();