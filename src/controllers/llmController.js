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
    .min(2)
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

      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004", 
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "My Internal Data",
      });
      
      const internalDataPdf = new PDFLoader("src/controllers/data/testing.pdf");
      const loadInternalDoc = await internalDataPdf.load();
      const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 500,
          chunkOverlap: 0,
      });
      const allSplits = await textSplitter.splitDocuments(loadInternalDoc);
      const vectorstore = await MemoryVectorStore.fromDocuments(
          allSplits,
          embeddings
      );

      const contextualizeQSystemPrompt = `Given a chat history and the latest user question
      which might reference context in the chat history, formulate a standalone question
      which can be understood without the chat history. Do NOT answer the question,
      just reformulate it if needed and otherwise return it as is.`;

      const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
        ["system", contextualizeQSystemPrompt],
        new MessagesPlaceholder("chat_history"),
        ["human", "{question}"],
      ]);
      const contextualizeQChain = contextualizeQPrompt
        .pipe(modelLLM)
        .pipe(new StringOutputParser());

        
      const retriever = vectorstore.asRetriever(1);
      
      // const docContext = retriever.invoke('apa itu Psikologi sosial')

      const SYSTEM_TEMPLATE = `Anda adalah seorang psikolog bernama Karina yang bertugas untuk memberikan empathy yang sangat tinggi terhadap orang yang bertanya, memberikan solusi maupun saran terhadap orang yang sedang curhat kepada anda, gunakan bahasa se friendly mungkin layaknya seperti teman atau psikiater jangan lupa gunakan tanda baca dan emoticon dan jawab dengan bahasa indonesia, gunakan pemahaman dasar dari context yang telah di sediakan dibawah <context> untuk menjawab pertanyaan atau Anda juga bisa berempati menggunakan pemahaman yang Anda punya jika informasi yang ada dalam context tidak relevan dengan pertanyaan user, Anda akan selalu menjawab dengan array JSON berisi pesan dengan format seperti dibawah. Dengan maksimal 3 pesan. Setiap pesan memiliki properti text, facialExpression, dan animation. expressions wajah yang berbeda adalah: smile, sad, angry, surprised, funnyFace, dan default. animations yang berbeda adalah: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, dan Angry. Setiap facialExpression dan animation disesuaikan dengan emosional jawaban kamu..\n
      <context>
      {context}
      </context>

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

      const documentChain = await createStuffDocumentsChain({
          llm: modelLLM,
          prompt: questionAnsweringPrompt,
      });

      // const result = await documentChain.invoke({
      //     messages: [new HumanMessage("Hallo, jelaskan psikologi sosial")],
      //     context: docContext,
      // });

      const parseRetrieverInput = (params) => {
        return params.question;
      };

      // const chatHistory = (params)=>{
      //   console.log(`ini adalah params ${params}`)
      //   return 'ini adalah chat history'
      // }

      const chatHistory = (input) => {
        if ("chat_history" in input) {
          return contextualizeQChain;
        }
        return input.question;
      };
      
      const parser = StructuredOutputParser.fromZodSchema(avatarResponseSchema);
      console.log(parser.getFormatInstructions());

      const retrievalChain = RunnablePassthrough
      .assign({
        question: async (input) => {
          if ("chat_history" in input) {
            return contextualizeQChain;
          }
          return input.question;
        },
      }).assign({
        context: RunnableSequence.from([
          parseRetrieverInput, 
          retriever, 
        ]),
      }).assign({
        answer: documentChain,
      });

      const result = await retrievalChain.invoke({
        question, 
        chat_history: chat_history.slice(-8),
        format_instructions: parser.getFormatInstructions(),
      });
      chat_history.push(new HumanMessage(result.question))
      chat_history.push(new AIMessage(result.answer))
      console.log(result)
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