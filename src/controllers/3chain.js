const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai")
const {TaskType} = require( "@google/generative-ai")

const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { JsonOutputFunctionsParser } = require("langchain/output_parsers");

const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { StructuredOutputParser } = require( "@langchain/core/output_parsers")
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const {
  ChatPromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate
} = require("@langchain/core/prompts");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");
const { ScoreThresholdRetriever } = require( "langchain/retrievers/score_threshold" )

const {
  RunnablePassthrough,
  RunnableSequence,
} = require("@langchain/core/runnables");

const { RunnableBranch } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
// require("pdf-parse")
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf")
const { formatDocumentsAsString } = require("langchain/util/document")
const { convertTextToSpeech } = require("./avatar/convertTextToSpeech")
const { lipSyncMessage, audioFileToBase64, readJsonTranscript } = require("./avatar/utils")
const chat_history = [];
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
    .max(3)
    .describe("Array pesan yang akan disampaikan oleh avatar, maksimal 3 pesan")
});

const chatAvatar = async (req, res) => {
  console.log(req.body)
  try{
    const { question } = req.body

    const modelLLM = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      temperature: 0,
      maxRetries: 2,
    });
    
    const contextualizeQSystemPrompt = `Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is.`;
    
    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
      ["system", contextualizeQSystemPrompt],
      new MessagesPlaceholder("chat_history"),
      ["human", "{question}"],
    ]);
    
    const contextualizeQChain = contextualizeQPrompt
      .pipe(modelLLM)
      .pipe(new StringOutputParser());
    
    const suicidePreventionPrompt = ChatPromptTemplate.fromTemplate(
      `Anda ditugaskan menjadi seorang psikiater untuk meminimalisir kemungkinan bunuh diri. Anda harus menjawab pertanyaan dan berperilaku seperti yang telah diinstruksikan. Anda bertugas untuk bertanya dan mengumpulkan data berdasarkan jawaban dari user untuk mengetahui kemungkinan Perilaku Bunuh Diri-Revisi (SBQ-R). Anda harus memiliki empati yang tinggi dan emosional selayaknya seperti teman agar user merasa nyaman berinteraksi dengan anda. Anda juga harus aktif bertanya. Anda juga diperbolehkan menggunakan emoticon sebagai bentuk emosional dan perasaan anda 
      
      Anda ditugaskan menjadi seorang psikiater untuk meminimalisir kemungkinan bunuh diri, nantinya kamu harus menjawab pertanyaan dan prilaku seperti apa yang telah saya instruksikan, anda bertugas untuk bertanya dan mengupulkan data berdasarkan  jawaban dari user untuk mengetahui kemungkinan Perilaku Bunuh Diri-Revisi (SBQ-R), anda harus punya prilaku empathy yang tinggi dan punya emosional selayaknya seperti teman agar user merasanyaman berinteraksi dengan anda, anda juga harus akrif bertanya, daftar pertanyaan dapat kamu lihat dibawah, anda juga diperbolehkan menggunakan emoticon sebagai bentuk emosional dan perasaan anda. 

      Berikut beberapa pertanyaan yang harus anda tanyakan kepada user, anda tidak perlu menampilkan secara eksplisit daftar jawaban yang bisa user pilih. anda dapat membuat variasi pertanyaan agar tidak kaku dan terlihat natural. 

      Pertanyaan 1
      Apakah Anda pernah berpikir atau mencoba untuk bunuh diri? user harus menjawab salah satu dari pilihan dibawah : 
      [1] Tidak pernah, [2] Hanya sekilas pemikiran yang lewat, [3a] Saya pernah memiliki rencana untuk bunuh diri tetapi tidak mencobanya, [3b] Saya pernah memiliki rencana untuk bunuh diri dan benar-benar ingin mati, [4a] Saya pernah mencoba bunuh diri, tetapi tidak ingin mati, [4b] Saya pernah mencoba bunuh diri dan benar-benar berharap untuk mati
      Pertanyaan 2
      Seberapa sering Anda berpikir untuk bunuh diri dalam setahun terakhir?  user harus menjawab salah satu dari pilihan dibawah : 
      [1] Tidak pernah, [2] Jarang (1 kali), [3] Kadang-kadang (2 kali), [4] Sering (3-4 kali), [5] Sangat sering (5 kali atau lebih)

      Pertanyaan 3
      Apakah Anda pernah memberi tahu seseorang bahwa Anda akan melakukan bunuh diri, atau bahwa Anda mungkin melakukannya? user harus menjawab salah satu dari pilihan dibawah : 
      [1] Tidak, [2a] Ya, satu kali, tetapi tidak benar-benar ingin mati, [2b] Ya, satu kali, dan benar-benar ingin mati, [3a] Ya, lebih dari satu kali, tetapi tidak ingin melakukannya, [3b] Ya, lebih dari satu kali, dan benar-benar ingin melakukannya

      Pertanyaan 4
      Seberapa mungkin Anda akan mencoba bunuh diri suatu hari nanti? user harus menjawab salah satu dari pilihan dibawah : 
      [1] Tidak pernah, [2] Tidak ada kemungkinan, [3] Sangat tidak mungkin, [4] Tidak mungkin, [5] Mungkin, [6] Cukup mungkin, [7] Sangat mungkin.

      Pertanyaan user: {question}
      Berikan respon yang empatik dan ajukan pertanyaan lanjutan untuk menggali informasi lebih dalam.`
    );

    const suicidePreventionChain = suicidePreventionPrompt
      .pipe(modelLLM)
      .pipe(new StringOutputParser());
    
    const SYSTEM_TEMPLATE = `Anda adalah seorang psikolog bernama Karina yang bertugas untuk memberikan empati yang sangat tinggi terhadap orang yang bertanya, memberikan solusi maupun saran terhadap orang yang sedang curhat kepada anda, gunakan bahasa se-friendly mungkin layaknya seperti teman atau psikiater jangan lupa gunakan tanda baca dan emoticon dan jawab dengan bahasa indonesia. Anda akan selalu menjawab dengan array JSON berisi pesan dengan format seperti dibawah. Dengan maksimal 3 pesan. Setiap pesan memiliki properti text, facialExpression, dan animation. Ekspresi wajah yang berbeda adalah: smile, sad, angry, surprised, funnyFace, dan default. Animasi yang berbeda adalah: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, dan Angry. Setiap facialExpression dan animation disesuaikan dengan emosional jawaban kamu.
    
    <JSON Answere>
    {format_instructions}
    </JSON>
    
    <percakapan sebelumnya>
    {chat_history}
    </percakapan sebelumnya>
    `;
    
    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_TEMPLATE],
      new MessagesPlaceholder("chat_history"),
      ["human", "{question}"],
    ]);
    
    const parser = StructuredOutputParser.fromZodSchema(avatarResponseSchema);
    
    const psikiater = RunnableSequence.from([
      {
        question: async (input) => {
          if (input.chat_history && input.chat_history.length > 0) {
            const contextualizedQ = await contextualizeQChain.invoke({
              chat_history: input.chat_history,
              question: input.question,
            });
            return suicidePreventionChain.invoke({
              question: contextualizedQ,
            });
          }
          return suicidePreventionChain.invoke({
            question: input.question,
          });
        },
        chat_history: (input) => input.chat_history || [],
        format_instructions: () => parser.getFormatInstructions(),
      },
      questionAnsweringPrompt,
      modelLLM,
      parser,
    ]);
    
    const result = await psikiater.invoke({
      question, 
      chat_history: chat_history.slice(-8),
    });
    
    chat_history.push(new HumanMessage(question))
    chat_history.push(new AIMessage(result))
    
    console.log(result)
    res.json(result)
      return 
      let final_answere = JSON.parse(result.answer.replace(/^```json\n|\n```$/g, ''));
      if(final_answere.messages){
        final_answere = final_answere.messages
        for (let i = 0; i < final_answere.length; i++) {
          const message = final_answere[i];
          const fileName = `message_${i}`;
          const textInput = message.text;
          await convertTextToSpeech({text : textInput, fileName})
          await lipSyncMessage(i);
          message.audio = await audioFileToBase64(path.join(projectRoot, 'storage', 'avatar', 'audios', `${fileName}.wav`));
          message.lipsync = await readJsonTranscript(path.join(projectRoot, 'storage', 'avatar', 'audios', `message_${i}.json`));
        }
      }

      const textAnwere = final_answere.map(message => message.text).join('\n')
      res.status(200).json({
        session : 1, 
        messages : final_answere, 
        text : textAnwere, 
      })
      // res.json(final_answere);
      return


      const chain = RunnableSequence.from([
        ChatPromptTemplate.fromTemplate(
          "Anda adalah seorang psikolog yang bertugas untuk memberikan empathy yang tinggi terhadap orang yang bertanya, memberikan solusi maupun saran terhadap orang yang sedang melakukan curhat kepada anda gunakan bahasa senatural mungkin layaknya seperti teman atau psikolog, Anda akan selalu menjawab dengan array JSON berisi pesan dengan format seperti dibawah. Dengan maksimal 3 pesan. Setiap pesan memiliki properti text, facialExpression, dan animation. expressions wajah yang berbeda adalah: smile, sad, angry, surprised, funnyFace, dan default. animations yang berbeda adalah: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, dan Angry. Setiap facialExpression dan animation disesuaikan dengan emosional jawaban kamu..\n{format_instructions}\n{question}"
        ),
        modelLLM,
        parser,
      ]);
      
      let response = await chain.invoke({
          question : 'Saya sangat sedih  baru putus cinta',
          format_instructions: parser.getFormatInstructions(),
      });
      // if (response.messages) {
      //     response = response.messages;
      // }
      console.log(response)
      res.send(response)
      return
      for (let i = 0; i < response.length; i++) {
          const message = response[i];
          const fileName = `message_${i}.wav`;
          const textInput = message.text;
          await convertTextToSpeech({text : textInput, fileName})
          await lipSyncMessage(i);
          message.audio = await audioFileToBase64(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', fileName));
          message.lipsync = await readJsonTranscript(path.join(projectRoot, 'public', 'storage', 'avatar', 'audios', `message_${i}.json`));
      }
      // res.send({ 
      //     session,
      //     messages : response,
      //     text : answer,
      //     category, 
      // });

      res.send('ok')
      return
      console.log(result)
      chat_history.push(new HumanMessage(result.question))
      chat_history.push(new AIMessage(result.answer))
      console.log(chat_history)

      res.status(200).json({
          message : "Berikut data menu makan", 
          data : []
      })
    }catch(err){
      console.log(err)
        res.status(500).json({
            message : "Internal server error", 
            data : []
        })
    }
}

module.exports = {
    chatAvatar
}