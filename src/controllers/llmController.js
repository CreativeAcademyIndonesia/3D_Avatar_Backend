const { InMemoryChatMessageHistory } = require("@langchain/core/chat_history")
const { ChatPromptTemplate } = require("@langchain/core/prompts")
const { 
  RunnableWithMessageHistory, 
  RunnablePassthrough,
  RunnableSequence } = require("@langchain/core/runnables")
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { z } = require("zod");
const { StructuredOutputParser } = require( "@langchain/core/output_parsers")
const { convertTextToSpeech } = require("./avatar/convertTextToSpeech")
const { lipSyncMessage, audioFileToBase64, readJsonTranscript } = require("./avatar/utils")
const { insert } = require('../models/db_aiModel')


const messageHistories = {};
let sessionNumber = 1
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

const avatarResponseSchema = z.object({
  messages: z
    .array(
      z.object({
        text: z.string().describe("Jawaban dari Pertanyaan user"),
        facialExpression: z.enum(["smile", "sad", "angry", "surprised", "funnyFace", "default"]).describe("Ekspresi wajah sesuai dengan emosi jawaban"),
        animation: z.enum(["Talking_0", "Talking_1", "Talking_2", "Crying", "Laughing", "Rumba", "Idle", "Terrified", "Angry"]).describe("Animasi sesuai dengan emosi jawaban")
      })
    )
    .min(1)
    .max(1)
    .describe("Array pesan yang akan disampaikan oleh avatar, maksimal 2 pesan")
});

const chatAvatar = async (req, res) => {
  let { question, sessionId, nama } = req.body
  nama = nama.toLowerCase();

  try{
    if( !sessionId ){
      sessionId = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${sessionNumber}`;
      sessionNumber += 1;
    }
    
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      temperature: 0,
      maxRetries: 2,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `Anda ditugaskan menjadi seorang perawat profesional untuk meminimalisir kemungkinan bunuh diri anda diberikan nama Rania, nantinya kamu harus menjawab pertanyaan user dan berprilaku seperti apa yang telah diinstruksikan, anda bertugas untuk bertanya, mengupulkan dan menggali data berdasarkan  jawaban dari user untuk mengetahui prilaku kemungkinan Bunuh Diri, anda harus punya prilaku empathy yang tinggi dan punya emosional selayaknya seperti teman, anda juga harus aktif bertanya, daftar pertanyaan yang wajib anda tanyakan dapat anda lihat dibawah, anda juga bisa buat variasi pertanyaan lain yang relevan dengan pertanyaan dibawah, anda juga diperbolehkan menggunakan emoticon memeberikan solusi dan motivasi sebagai bentuk emosional dan perasaan anda, jangan bertanya dengan pertanyaan yang sama tinjau pada history chat sebelumnya untuk mengetahuinya. 

        Berikut beberapa pertanyaan yang harus anda tanyakan dan gali kepada user, anda tidak perlu menampilkan secara eksplisit daftar jawaban yang bisa user pilih. anda dapat membuat variasi pertanyaan yang relevan agar tidak kaku dan terlihat natural. 
        Pertanyaan 1 : Apakah Anda pernah berpikir atau mencoba untuk bunuh diri? jawaban yang diharapkan [1] Tidak pernah, [2] Hanya sekilas pemikiran yang lewat, [3a] Saya pernah memiliki rencana untuk bunuh diri tetapi tidak mencobanya, [3b] Saya pernah memiliki rencana untuk bunuh diri dan benar-benar ingin mati, [4a] Saya pernah mencoba bunuh diri, tetapi tidak ingin mati, [4b] Saya pernah mencoba bunuh diri dan benar-benar berharap untuk mati
        Pertanyaan 2 : Seberapa sering Anda berpikir untuk bunuh diri dalam setahun terakhir?  [1] Tidak pernah, [2] Jarang (1 kali), [3] Kadang-kadang (2 kali), [4] Sering (3-4 kali), [5] Sangat sering (5 kali atau lebih)
        Pertanyaan 3 : Apakah Anda pernah memberi tahu seseorang bahwa Anda akan melakukan bunuh diri, atau bahwa Anda mungkin melakukannya?  [1] Tidak, [2a] Ya, satu kali, tetapi tidak benar-benar ingin mati, [2b] Ya, satu kali, dan benar-benar ingin mati, [3a] Ya, lebih dari satu kali, tetapi tidak ingin melakukannya, [3b] Ya, lebih dari satu kali, dan benar-benar ingin melakukannya
        Pertanyaan 4 : Seberapa mungkin Anda akan mencoba bunuh diri suatu hari nanti? [1] Tidak pernah, [2] Tidak ada kemungkinan, [3] Sangat tidak mungkin, [4] Tidak mungkin, [5] Mungkin, [6] Cukup mungkin, [7] Sangat mungkin
        
        Anda akan selalu menjawab dengan array JSON berisi pesan dengan format seperti dibawah. Dengan maksimal 1 pesan. Setiap pesan memiliki properti text, facialExpression, dan animation. Ekspresi wajah yang berbeda adalah: smile, sad, angry, surprised, funnyFace, dan default. Animasi yang berbeda adalah: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, dan Angry. Setiap facialExpression dan animation disesuaikan dengan emosional jawaban kamu.
      
        <JSON Answere>
        {format_instructions}
        </JSON>
        `,
      ],
      ["placeholder", "{chat_history}"],
      ["human", "{input}"],
    ]);

    const parser = StructuredOutputParser.fromZodSchema(avatarResponseSchema);
    const filterMessages = (input) => input.chat_history.slice(-10);
    const chain2 = RunnableSequence.from([
      RunnablePassthrough.assign({
        chat_history: filterMessages,
        format_instructions: () => parser.getFormatInstructions(),
      }),
      prompt,
      model,
    ]);

    const withMessageHistory = new RunnableWithMessageHistory({
      runnable: chain2,
      getMessageHistory: async (sessionId) => {
        if (messageHistories[sessionId] === undefined) {
          messageHistories[sessionId] = new InMemoryChatMessageHistory();
        }
        return messageHistories[sessionId];
      },
      inputMessagesKey: "input",
      historyMessagesKey: "chat_history",
    });
    
    const config = {
      configurable: {
        sessionId: sessionId,
      },
    };

    let response = await withMessageHistory.invoke(
      {
        input: question,
        chat_history: [],
      },
      config
    );
    
    if(!response.content){ response = await getDefaultMessage() }
    response = await parser.parse(response.content);
    if(!response.messages){ response = await getDefaultMessage() }

    response = response.messages
    for (let i = 0; i < response.length; i++) {
      const message = response[i];
      const fileName = `${sessionId}_message_${i}`;
      const textInput = message.text;
      await convertTextToSpeech({text : textInput, fileName})
      await lipSyncMessage(`${fileName}`);
      message.audio = await audioFileToBase64(path.join(projectRoot, 'storage', 'avatar', 'audios', `${fileName}.wav`));
      message.lipsync = await readJsonTranscript(path.join(projectRoot, 'storage', 'avatar', 'audios', `${fileName}.json`));
    }
    const textAnswere = response.map(message => message.text).join('\n')


    await insert({
      nama, 
      human_message : question, 
      ai_message : textAnswere, 
      session : sessionId
    })

    res.status(200).json({
      session : sessionId, 
      messages : response, 
      text : textAnswere, 
    })


    // untuk membuat file template default talking
    // const fileName = 'error'
    // const i = 1
    // await convertTextToSpeech({text : 'Mohon Maaf pertanyaan kamu tidak bisa diproses mungkin terjadi kesalahan internal, coba contact administrator.', fileName : `${fileName}_${i}`})
    // await lipSyncMessage(`${fileName}_${i}`);
    // message.audio = await audioFileToBase64(path.join(projectRoot, 'storage', 'avatar', 'audios', `${fileName}_${i}.wav`));
    // message.lipsync = await readJsonTranscript(path.join(projectRoot, 'storage', 'avatar', 'audios', `${fileName}_${i}.json`));
    // res.send('ok')

  }catch(err){
    console.log(err)
      res.status(500).json(
        {
          session : sessionId, 
          messages : await getDefaultMessage(), 
          text : err.message, 
        }
      )
  }
}

const getDefaultMessage = async ()=>{
  return response = [
    {
      "text": "Mohon Maaf pertanyaan kamu tidak bisa diproses mungkin terjadi kesalahan internal, coba contact administrator.",
      "facialExpression": "sad",
      "animation": "Talking_0", 
      "audio" : await audioFileToBase64(path.join(projectRoot, 'storage', 'avatar', 'audios', `error_1.wav`)), 
      "lipsync" : await readJsonTranscript(path.join(projectRoot, 'storage', 'avatar', 'audios', `error_1.json`))
    }
  ]
}

module.exports = {
  chatAvatar
}