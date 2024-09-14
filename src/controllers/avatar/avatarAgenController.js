
const { profitLost } = require("../langchain/tools/profitLost")
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { ChatOpenAI } = require("@langchain/openai");
const { JsonOutputFunctionsParser } = require("langchain/output_parsers");
const {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} = require("@langchain/core/prompts");
const { convertTextToSpeech } = require('./convertTextToSpeech')
const { lipSyncMessage, readJsonTranscript, audioFileToBase64 } = require('./utils')
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');

const avatarResponseSchema = z.object({
  messages: z
    .array(
      z.object({
        text: z.string().describe("Teks pesan yang akan diucapkan oleh avatar"),
        facialExpression: z.enum(["smile", "sad", "angry", "surprised", "funnyFace", "default"]).describe("Ekspresi wajah avatar"),
        animation: z.enum(["Talking_0", "Talking_1", "Talking_2", "Crying", "Laughing", "Rumba", "Idle", "Terrified", "Angry"]).describe("Animasi yang akan ditampilkan oleh avatar")
      })
    )
    .max(3)
    .describe("Array pesan yang akan disampaikan oleh avatar, maksimal 3 pesan")
});
  
async function avatarAgenAI(req, res) {
    try {
        const predictionAgenProfitLost = await profitLost(req.body);
        const { category, session, answer } = predictionAgenProfitLost
        
        const prompt = new ChatPromptTemplate({
            promptMessages: [
                SystemMessagePromptTemplate.fromTemplate(
                `Anda adalah seorang psikolog yang bertugas untuk memberikan empathy yang tinggi terhadap orang yang bertanya, memberikan solusi maupun saran terhadap orang yang sedang melakukan curhat kepada anda gunakan bahasa senatural mungkin layaknya seperti teman atau psikolog, Anda akan selalu menjawab dengan array JSON berisi pesan. Dengan maksimal 3 pesan. Setiap pesan memiliki properti text, facialExpression, dan animation. expressions wajah yang berbeda adalah: smile, sad, angry, surprised, funnyFace, dan default. animations yang berbeda adalah: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, dan Angry. Setiap facialExpression dan animation disesuaikan dengan emosional jawaban kamu.`
                ),
                HumanMessagePromptTemplate.fromTemplate("{question}"),
            ],
            inputVariables: ["question"],
        });
        
        const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.2 });
        
        const functionCallingModel = llm.bind({
            functions: [
                {
                name: "output_formatter",
                description: "Should always be used to properly format output",
                parameters: zodToJsonSchema(avatarResponseSchema),
                },
            ],
            function_call: { name: "output_formatter" },
        });
        
        const outputParser = new JsonOutputFunctionsParser();
        
        const chain = prompt.pipe(functionCallingModel).pipe(outputParser);
        
        let response = await chain.invoke({
            question : answer,
        });
        if (response.messages) {
            response = response.messages;
        }
        for (let i = 0; i < response.length; i++) {
            const message = response[i];
            const fileName = `message_${i}.wav`;
            const textInput = message.text;
            await convertTextToSpeech({text : textInput, fileName})
            await lipSyncMessage(i);
            message.audio = await audioFileToBase64(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', fileName));
            message.lipsync = await readJsonTranscript(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', `message_${i}.json`));
        }
        res.send({ 
            session,
            messages : response,
            text : answer,
            category, 
        });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        res.status(500).send({
            error: true,
            message: "Terjadi kesalahan saat memproses permintaan: " + error.message
        });
    }
}

module.exports = {
    avatarAgenAI
}