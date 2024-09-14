const OpenAI = require("openai");
const path = require('path');
const { convertTextToSpeech } = require('./convertTextToSpeech')
const { lipSyncMessage, readJsonTranscript, audioFileToBase64 } = require('./utils')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "-",
});

const projectRoot = path.resolve(__dirname, '..', '..');

async function chatAvatar(req, res){
    const userMessage = req.body.message;
    if (!userMessage) {
        res.send({
            messages: [
                {
                    text: "Hey dear... How was your day?",
                    audio: await audioFileToBase64(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', 'intro_0.wav')),
                    lipsync: await readJsonTranscript(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', 'intro_0.json')),
                    facialExpression: "smile",
                    animation: "Talking_1",
                },
                {
                    text: "I missed you so much... Please don't go for so long!",
                    audio: await audioFileToBase64(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', 'intro_1.wav')),
                    lipsync: await readJsonTranscript(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', 'intro_1.json')),
                    facialExpression: "sad",
                    animation: "Crying",
                },
            ],
        });
        return;
    }
    
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1000,
        temperature: 0.6,
        response_format: {
            type: "json_object",
        },
        messages: [
        {
            role: "system",
            content: `
            You are a communication assistant, named GiscaX.
            You will always reply with a JSON array of messages. With a maximum of 3 messages.
            Each message has a text, facialExpression, and animation property.
            The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
            The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry. 
            `,
        },
        {
            role: "user",
            content: userMessage || "Hello",
        },
        ],
    });
    let messages = JSON.parse(completion.choices[0].message.content);
    console.log(messages)
    if (messages.messages) {
        messages = messages.messages;
    }
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const fileName = `message_${i}.wav`;
        const textInput = message.text;
        await convertTextToSpeech({text : textInput, fileName})
        await lipSyncMessage(i);
        message.audio = await audioFileToBase64(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', fileName));
        message.lipsync = await readJsonTranscript(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', `message_${i}.json`));
    }
    
    res.send({ messages });
}
module.exports = {
    chatAvatar
}

