import { stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from 'url';
import Alaram from './alarm.js';
import sharp from "sharp";
import Sender from "./sender.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sender = Sender();

const fileExists = async (filePathCheck) => {
    try {
        await stat(filePathCheck);
        return true;
    } catch {
        return false;
    }
};

const getTemplate = (templateLength) => {
    let numberTemplate = "";
    for (let i = 0; i < templateLength; i++) {
        numberTemplate += "0";
    }
    return numberTemplate;
}

const getNumberByTemplate = (template, number) => {
    const frameNumberString = template + number;
	return frameNumberString.substring(frameNumberString.length - template.length);
}

const framesGenerator = (framesPreferences) => {
    let currentFrame = framesPreferences.start;
    let currentFramePath = "";
    let currentFrameNumberString = "";
    let frames = [];

    const ASCII_CHARS = framesPreferences.asciiChars.split("");
    const charLength = ASCII_CHARS.length;
    const interval = charLength / 256;

    const actualFrameTime = framesPreferences.duration * 1000 / (framesPreferences.end - framesPreferences.start + 1);
    const targetFrameTime = 1000 / framesPreferences.targetFps;

    const numberTemplate = getTemplate(framesPreferences.templateLength);

    const setFirstFilePath = (numberTemplate, framesPreferences) => {
        const frameNumberString = numberTemplate + 1;
        const frameName = frameNumberString.substring(frameNumberString.length - numberTemplate.length);
        const fileName = framesPreferences.template.replace("%", frameName) + `.${framesPreferences.extention}`;
        currentFramePath =  join(__dirname, "..", framesPreferences.dir, fileName);
        currentFrameNumberString = frameName;
    }
    const nextFrame = () => {
        const nextFrameNumberString = getNumberByTemplate(numberTemplate, currentFrame);
        currentFramePath = currentFramePath.replace(currentFrameNumberString, nextFrameNumberString);
        currentFrameNumberString = nextFrameNumberString;
    }

    const updateFramePath = () => {
        if (currentFramePath == "") {
            setFirstFilePath(numberTemplate, framesPreferences);
        } else {
            nextFrame();
        }
    }

    const newFramesGenerator = {
        generate: async () => {

            const currenAlarm = Alaram(
                targetFrameTime, 
                framesPreferences.duration * 1000, 
                async (timePassed) => {
                    const frameNumber = Math.floor(timePassed / actualFrameTime);
                    if (frames[frameNumber]) {
                        await sender.send(frames[frameNumber]);
                    }
                }
            )

            while (true) {
                updateFramePath();

                if (!await fileExists(currentFramePath) || currentFrame > framesPreferences.end) break;

                const file = sharp(currentFramePath);
                const pixels = await file
                    .gamma()
                    .greyscale()
                    .resize(framesPreferences.outputSize.width, framesPreferences.outputSize.height)
                    .raw()
                    .toBuffer();

                let count = 0;
                let characters = "";
                pixels.forEach((pixel) => {
                    characters += ASCII_CHARS[Math.floor(pixel * interval)] + " ";
                    if (count % framesPreferences.outputSize.width == framesPreferences.outputSize.width - 1)
                        characters += "\n";
                    count++;
                });
                frames.push(characters);
                currentFrame++;

                // todo: get rid of await
                await currenAlarm.emit();
            }

            while(true) {
                // todo: get rid of await
                await currenAlarm.emit();
            }
        },
        getFrames: () => {
            return frames;
        }
    }

    return newFramesGenerator;
}

export default framesGenerator;
