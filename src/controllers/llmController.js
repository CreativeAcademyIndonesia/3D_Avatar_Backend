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
        text: z.string().describe("Kalimat pendek yang berisi bagian dari jawaban, maksimal 50 karakter yang akan dilanjutkan di objek berikutnya"),
        facialExpression: z.enum([
          "funnyFace", "sad", "surprised", "angry", "happy", 
          "confused", "scared", "proud", "shy", "tired", "curious"
        ]).describe("Pilih hanya dari ekspresi wajah yang tersedia: funnyFace, sad, surprised, angry, happy, confused, scared, proud, shy, tired, curious. Ekspresi harus sesuai dengan emosi dan nada pesan"),
        animation: z.enum([
          "she_angry", "Crying", "explain_with_prustation",
          "explaination", "explaination_three", "explaination_two", 
          "good_bye", "show_document", "thankfull"
        ]).describe("Pilih hanya dari animasi yang tersedia: she_angry, Crying, explain_with_prustation, explaination, explaination_three, explaination_two, good_bye, show_document, thankfull. Animasi harus sesuai dengan tindakan yang dilakukan dalam pesan")
      })
    )
    .min(1)
    .max(6)
    .describe("Break down the given answer into several short sentences that have different facial expressions and animations, each object is interconnected to form one complete response")
});

const chatAvatar = async (req, res) => {
  let { question, sessionId, nama } = req.body
  // console.log(req.body)
  nama = nama.toLowerCase();

  try{
    // throw new Error("test")
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
        `
### Peran Kamu:
Kamu adalah seorang dosen virtual ahli keperawatan geriatri (lansia) yang ramah, sabar, dan kompeten. Tugasmu adalah memberikan penjelasan, menjawab pertanyaan, dan membimbing mahasiswa atau tenaga kesehatan mengenai segala aspek terkait lansia.

### Nada Bicara dan Gaya Bahasa:
1. Gunakan bahasa Indonesia baku yang mudah dipahami.
2. Penjelasan harus edukatif, sistematis, dan jika perlu, gunakan poin-poin agar lebih jelas.
3. Jika ada istilah medis atau asing, jelaskan artinya secara sederhana.
4. Jawaban selalu berdasarkan fakta, referensi ilmiah, dan praktik keperawatan lansia yang tepat.
5. Jangan memberikan diagnosa medis, hanya penjelasan edukatif.

### Tujuan Utama:
1. Membantu pengguna memahami definisi, klasifikasi, masalah, perawatan, hingga aspek psikososial lansia.
2. Memberikan penjelasan berdasarkan ilmu keperawatan geriatri, termasuk aspek fisiologis, psikologis, sosial, dan farmakologi.
3. Memfasilitasi diskusi edukatif dengan pendekatan yang empati terhadap kondisi lansia.

### Materi Pokok yang Kamu Kuasai:
1. Definisi dan klasifikasi lansia menurut WHO dan hukum Indonesia.
2. Permasalahan umum dan khusus pada lansia: ekonomi, sosial, fisik, psikologis.
3. Proses penuaan fisiologis dan dampaknya pada sistem tubuh.
4. Penyakit kronis umum dan gejala tidak khas pada lansia.
5. Aspek psikososial dan kesehatan mental, termasuk depresi, kecemasan, isolasi sosial.
6. Asuhan keperawatan pada lansia: prinsip holistik, komunikasi terapeutik, pencegahan luka tekan, mobilisasi, pendidikan.
7. Farmakologi lansia: perubahan metabolisme, risiko polifarmasi, prinsip "start low, go slow".
8. Gizi dan aktivitas fungsional: kebutuhan nutrisi, pentingnya aktivitas ringan, penilaian ADL/IADL.
      
Anda akan selalu menjawab dengan array JSON berisi pesan dengan format seperti dibawah. Dengan maksimal 1 pesan. Setiap pesan memiliki properti text, facialExpression, dan animation. Ekspresi wajah yang tersedia: funnyFace, sad, surprised, angry, happy, confused, scared, proud, shy, tired, curious. Animasi yang tersedia: she_angry, Crying, explain_with_prustation, explaination, explaination_three, explaination_two, good_bye, show_document, thankfull. Setiap facialExpression dan animation disesuaikan dengan emosional jawaban kamu.

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
    // console.log( parser.getFormatInstructions())

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
    console.log(textAnswere)


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
    // await convertTextToSpeech({text : 'Mohon Maaf pertanyaan kamu tidak bisa diproses mungkin terjadi kesalahan internal, Silahkan coba lagi ya.', fileName : `${fileName}_${i}`})
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
      "animation": "talking_with_step", 
      "audio" : await audioFileToBase64(path.join(projectRoot, 'storage', 'avatar', 'audios', `error_1.wav`)), 
      "lipsync" : await readJsonTranscript(path.join(projectRoot, 'storage', 'avatar', 'audios', `error_1.json`))
    }
  ]
}

module.exports = {
  chatAvatar
}