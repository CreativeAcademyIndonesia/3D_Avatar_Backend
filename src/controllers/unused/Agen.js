// Human resource Chat SQL versi Alpha
const { 
  ChatPromptTemplate, 
  HumanMessagePromptTemplate, 
  MessagesPlaceholder,
  FewShotPromptTemplate,
  FewShotChatMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
} = require("@langchain/core/prompts")
const { SemanticSimilarityExampleSelector } = require("@langchain/core/example_selectors");
const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai")
const { createOpenAIToolsAgent, AgentExecutor } = require("langchain/agents")
const { SqlToolkit } = require("langchain/agents/toolkits/sql")
const { SqlDatabase } = require("langchain/sql_db")
const { DataSource } = require("typeorm")
const { HumanMessage, AIMessage } = require('@langchain/core/messages')
const { sqlPrefixHrGa } = require("../prefix/sqlPrefixHrGa")
const { sqlPrefixProfitLost } = require("../prefix/sqlPrefixProfitLost")

const { Pinecone } = require("@pinecone-database/pinecone");
const { Document } = require("@langchain/core/documents");
const { PineconeStore } = require("@langchain/pinecone");

const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { ScoreThresholdRetriever } = require("langchain/retrievers/score_threshold");
const { getInfoUser, saveChat, chatHistoryFormater } = require('./gistexHrmTools')
const { toolGetToday, toolGetThisWeek, toolGetYesterday, toolGetThisYear, toolGetLastYear, toolGetLastWeek, toolGetThisMonth } = require("./toolkit/date")

const { getStringDateInfo } = require("./toolkit/date")

// const modelName = "gpt-4o"
// const modelName = "gpt-3.5-turbo"
exports.profitLost = async ({message : pesan, nik, sessionId, category, modelName = "gpt-4o-mini"}) => {  
  try{
      // User History Initialize
      let userInfo = await getInfoUser({nik})
      let session = {
          sessionId : sessionId ? sessionId : null, 
          nik : userInfo[0].nik, 
          nama : userInfo[0].nama, 
          category : category, 
          object : pesan.slice(0, 50)
      }
      let chatHistory = await chatHistoryFormater({session : sessionId})
      const {dateNow, day, yesterday, thisWeek, thisYear, thisMonth } = getStringDateInfo()

      const llm = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash",
        temperature: 0,
        maxRetries: 2,
      });

      
      const tools = [
        toolGetToday, 
        toolGetThisWeek, 
        toolGetYesterday, 
        toolGetThisYear, 
        toolGetLastYear, 
        toolGetLastWeek, 
        toolGetThisMonth
      ];
      
      const queryTransformPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("messages"),
          [
              "user",
              `Berdasarkan riwayat percakapan di atas, jika pertanyaan terakhir nampaknya terikat dengan percakapan sebelumnya makan ubah pertanyaan terakhir agar memiliki informasi dan konteks yang relevan dengan percakapan tersebut, kecuali jika pertanyaan terakhir tersebut memiliki konteks yang berbeda maka cukup tambahkan informasi waktu saja atau cukup jawab dengan text yang sama dengan pertanyaan, 
              
              Jangan terlalu signifikan mengubah istilah kata kata dari daftar dibawah agar memudahkan nantinya dalam percarian data yang relevan, berikut daftar istilah : Output factory, Income factory, Profit ($), Profit %, Penyebab Loss, Plan income per-line, Plan shipment, Realisasi shipment, Persentase overship dari qty order, Persentase shortage dari qty cutting, Biaya overtime, Overtime terbesar, Berapa kali staff atas nama... tidak masuk dalam bulan..., Income Line, Output per-buyer, Persentase output per-buyer, Persentase shipment, Penyebab loss per-line, Persentase rework, Persentase reject, Top-5 point reject, Effisiensi, buyer

              Tambahkan informasi waktu untuk melengkapi jawaban atau pertanyaan. Anda harus memodifikasi pertanyaan user jika menyebutkan informasi branch/factory, contoh daftar branch atau factory yang ada branch Cahaya busana abadi maka lengkapi dengan lengkapi dengan (CBA), Cahaya busana abadi lengkapi dengan (CBA), majalengka 2 lengkapi dengan (MJ2) dan (GM2), majalengka 1 lengkapi dengan (MJ1) dan (GM1), chawan lengkapi dengan (CHW), cahyo nugroho jati lengkapi dengan (CNJ2), kalibenda lengkapi dengan (KLB), cv anugrah lengkapi dengan (CVA), cileunyi lengkapi dengan (CJL) dan (CLN), cv anugrah 2 lengkapi dengan (CVA2), jika user tidak sama sekali menyebutkan branch atau factory maka jangan tambahkan branch kedalam jawaban. atau tambahkan jawaban dengan semua branch & factory

              hanya berikan jawaban tranformasi quernya saja tidak ada yang lain
              `,
          ],
      ]);

      
      const queryTransformationChain = queryTransformPrompt.pipe(llm);
      const queryTransform = await queryTransformationChain.invoke({
          messages: [
              new HumanMessage(`Gunakan informasi waktu yang tersedia dibawah ini sebagai referensi : 
               ${yesterday}, ${day}, tanggal ${dateNow}, tanggal minggu ini ${thisWeek}, tahun ini ${thisYear}, bulan ini ${thisMonth}, Gunakan informasi tanggal ini sebagai referensi untuk mendapatkan tanggal, bulan, minggu saat ini ataupun menentukan tanggal untuk hari hari yang disebutkan oleh user misalnya menentuka tanggal untuk 'hari kamis kemarin' yang mengacu pada 7 hari sebelum tanggal hari ini. `), 
               new AIMessage(`Saya akan melengkapi pertanyaan kamu selanjutnya dengan informasi waktu yang kamu berikan`),
              ...chatHistory.slice(-8).reverse(),
              new HumanMessage(pesan)
          ]
      });
      console.log("Transformation Query : ", queryTransform.content)
      // console.log("chat history", [
      //     ...chatHistory,
      //     new HumanMessage(pesan)
      // ])
      // End Query Transformation

      const searchVector = await vectorStore.maxMarginalRelevanceSearch(queryTransform.content, { lambda : 0.8, k: 3, fetchK: 10 });
      let sampleQuestion = searchVector ? searchVector.map(doc => ({
          input: doc.pageContent,
          description: doc.metadata.description,
          instruction: doc.metadata.instruction, 
          query: doc.metadata.query
      })) : [];

      console.log("Sample Query", sampleQuestion)
      //   return
      //   return
      //   return
      // const result = await vectorStore.similaritySearch(pesan);
      // console.log(result)
      // return 
      // const retriever = ScoreThresholdRetriever.fromVectorStore(vectorStore, {
      //     searchType: "mmr",
      //     minSimilarityScore: 0.7,
      //     maxK: 10,
      //     kIncrement: 1,
      // });

      // const exampleSelector = new SemanticSimilarityExampleSelector({
      //     vectorStoreRetriever: pineconeMmrRetriever,
      //     inputKeys: ["description"],
      // });
      
      // const contextQuery = await exampleSelector.selectExamples({ input: pesan})
      // console.log( pesan , sampleQuestion );
      // return

      // Menggunakan Vector Store Langchain
      // const vectorStores = await MemoryVectorStore.fromTexts(
      //     ["menu makan hari ini", "menu makan minggu ini", "hello nice world"],
      //     [{ id: 2 }, { id: 1 }, { id: 3 }],
      //     new OpenAIEmbeddings()
      // );
      // const resultOne = await vectorStores.similaritySearch("Perkenalkan nama saya agus sugandi", 1);
      // console.log(resultOne)
      // return {resultOne : resultOne}
      const SQL_PREFIX = sqlPrefixProfitLost({nama : userInfo[0].nama, department : userInfo[0].departemen});
      const SQL_SUFFIX = `Begin!
          Question: {input},
          """Thought 1 - Saya perlu meninjau dan mempertimbangkan riwayat percakapan sebelumnya dari yang terbaru dan menindak lanjutinya, Menggunakan dan memodifikasi query sql yang relevan sesuai dengan instruksi query, Jika tidak ada sample Query yang relevan, saya akan eksekusi tools atau fungsi yang ada yang paling relevan untuk menjawab pertanyaan user atau menjawab dengan "GiscaX tidak memiliki data, Coba berikan pertnyaan yang lebih spesifik." jika tidak mendapatkan query atau fungsi yang spesifik."""

          """Thought 2 - jika saya menemukan kalusa WHERE tanggal, atau WHERE tanggal BETWEEN dalam query yang akan dieksekusi, saya akan menggunakan tanggal default yang telah ditentukan dalam instruksi query atau menggunakan tanggal yang telah di tentukan secara spesifik oleh pengguna. Gunakan klausa WHERE LIKE 'value%' jika membutuhkan beberapa kondisi tambahan dalam query yang tidak disebutkan dalam sample"""

          """Thought 3 - Saya akan menggunakan tools atau fungsi get_today, get_this_month, get_this_week, get_yesterday, get_this_year, get_last_year, get_last_week sebagai referensi untuk mendapatkan tanggal, bulan, minggu saat ini ataupun menentukan tanggal untuk hari hari yang disebutkan oleh user misalnya menentuka tanggal untuk 'hari kamis kemarin' yang mengacu pada 7 hari sebelum tanggal hari ini."""
          
          """Thought 4 - Sebelum menjalankan tool Info_absensi, saya akan query tabel ai_employee untuk mendapatkan informasi NIK karyawan berdasarkan nama input pengguna menggunakan LIKE "nama%"."""

          Deskripsi tabel:
          1. tabel ai_employee ini seputar data karyawan, jika membutuhkan data karyawan cari di tabel ini
          2. tabel ai_profit_lost_summary ini seputar profit lost, jika membutuhkan data profit lost cari di tabel ini
          
          {agent_scratchpad}`

      const fewShotPrompt = new FewShotPromptTemplate({
          // exampleSelector : sampleQuestion,
          examples : sampleQuestion,
          examplePrompt : PromptTemplate.fromTemplate(`""" Question user : {input}, Query sql : {query}, {description}, instruction : {instruction} """`
          ),
          inputVariables: ["input", "dialect", "top_k"],
          prefix: `Cari dan eksekusi query yang paling relevan lalu modifikasi query sesuai dengan instuksi modifikasi pada bagian yang dibatasi oleh tanda kutip tiga atau yang diapit dengan tanda siku <>, ? sesuaikan nilainya dengan informasi yang didapat dari pengguna. Gunakan klausa WHERE LIKE 'value%' jika membutuhkan beberapa kondisi tambahan dalam query yang tidak disebutkan dalam sample, Gunakan tanggal hari ini jika user tidak memberikan tanggal spesifik, atau gunakan tanggal default yang ada dalam instruksi query sebagai referensi untuk memodifikasi query SQL menggunakan klausa WHERE. Informasi waktu: tanggal hari ini ${day}, tanggal ${dateNow}, tanggal minggu ini ${thisWeek}, tahun ini ${thisYear}, bulan ini ${thisMonth} sebagai referensi untuk mendapatkan tanggal, bulan, minggu saat ini ataupun menentukan tanggal untuk hari hari yang disebutkan oleh user misalnya menentuka tanggal untuk 'hari kamis kemarin' yang mengacu pada 7 hari sebelum tanggal hari ini. JANGAN pernah mengubah query nama tabel yang digunakan, Selalu gunakan tabel yang diberikan dalam sample query.
              """Sample Query"""
              `,
          suffix: "",
      });

      // console.log(fewShotPrompt)

      // const model = new ChatOpenAI({});
      // const chain = fewShotPrompt.pipe(model);
      // const result = await chain.invoke({
      //     input: pesan,
      //     dialect: sqlToolKit.dialect,
      //     top_k: "2",
      // });
          
      // console.log(result)
      // return result

      const prompt = ChatPromptTemplate.fromMessages([
          new MessagesPlaceholder("chat_history"),
          ["system", SQL_PREFIX],
          new SystemMessagePromptTemplate(fewShotPrompt),
          new AIMessage(SQL_SUFFIX.replace("{agent_scratchpad}", ``)),
          ["human", "{input}"],
          new MessagesPlaceholder("agent_scratchpad"),
      ]);
      
      const newPrompt = await prompt.partial({
          dialect: sqlToolKit.dialect,
          top_k: "20",
      });

      const runnableAgent = await createOpenAIToolsAgent({
          llm,
          tools,
          prompt: newPrompt,
      });
  
      const agentExecutor = new AgentExecutor({
          agent: runnableAgent,
          tools,
          handleParsingErrors: "Please try again, paying close attention to the allowed enum values, use the format dd-mm-yyyy for date queries",
      });

      console.log(`Pertanyaan User : ${pesan}, atau ${queryTransform.content}`)
      const answer = await agentExecutor.invoke({
          input: `${pesan}, atau ${queryTransform.content}`,
          chat_history : chatHistory.slice(-8).reverse()
      })

      if(answer.output != 'Agent stopped due to max iterations.'){
          chatHistory.push(new HumanMessage(answer.input))
          chatHistory.push(new AIMessage(answer.output))
      }
      
      const expense =  'Tidak Diketahui'
      const message = `Pengelolaan data menggunakan <b>Open Ai</b> menggunakan model <b>${modelName}</b> dengan biaya perkiraan : <b>${expense}</b>`
     
      // Save history chat into database
      let partialChatHistory = {
          session_id : session.sessionId, 
          message_human : answer.input,
          message_ai : answer.output
      }

      const createSession = await saveChat({session, chat_history : partialChatHistory })
      if(createSession.newSession){
          session.sessionId = createSession.newSessionId
      }
      
      let contentJSON = {
          question : answer.input,
          answer : answer.output, 
          category : "profit lost", 
          expense :  'Tidak Diketahui', 
          message: message,
          session : session.sessionId,
      }
      return contentJSON

  }catch(err){
      let contentJSON = {
          question : "-",
          answer : err.message, 
          category : "profit lost", 
          expense :  'Tidak Diketahui', 
          message: `Terjadi kesalahan dalam pemrosesan data. Error : ${err.message}`,
          // session : session.sessionId,
      }
      return contentJSON
      // console.error("Error:", err);
      // return { message: `Terjadi kesalahan dalam pemrosesan data. Error : ${err.message}`, error: err.message }
  }
}