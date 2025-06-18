import nodeFetch from "node-fetch";
import config from "../config.json" assert { type: "json" };
const webhookUrl = config.hook;

const payload = {
    text: "test",
    username: "Bad Apple",
    icon_url: "https://ru.touhouwiki.net/images/thumb/b/b5/BadApple_Reimu.png/300px-BadApple_Reimu.png"
};

const send_test = () => { 
    let requestReady = true;

    const newSender = {
        send: async (art) => {
            if (requestReady) {
                requestReady = false;
                payload.text = `\`\`\`\n${art}\`\`\``;
                await nodeFetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .catch(err => console.error(err))
                requestReady = true;
            }
        }
    }

    return newSender;
}

export default send_test;