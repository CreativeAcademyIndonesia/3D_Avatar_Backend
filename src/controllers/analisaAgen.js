const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { z } = require("zod");
const { StructuredOutputParser } = require( "@langchain/core/output_parsers");
const { AIMessage, HumanMessage } = require("@langchain/core/messages");
const { ChatPromptTemplate } = require('@langchain/core/prompts')
const { 
    RunnablePassthrough,
    RunnableSequence } = require("@langchain/core/runnables")
const { saveAnalisa } = require('../models/db_aiModel')

const analyticsSchema = z.object({
    pertanyaan_1: z.enum(['[1]', '[2]', '[3a]', '[3b]', '[4a]', '[4b]'])
      .default('[1]')
      .describe("Pilih jawaban dari pertanyaan pertama: [1] Tidak pernah, [2] Hanya sekilas pemikiran yang lewat, [3a] Saya pernah memiliki rencana untuk bunuh diri tetapi tidak mencobanya, [3b] Saya pernah memiliki rencana untuk bunuh diri dan benar-benar ingin mati, [4a] Saya pernah mencoba bunuh diri, tetapi tidak ingin mati, [4b] Saya pernah mencoba bunuh diri dan benar-benar berharap untuk mati"),
      
    pertanyaan_2: z.enum(['[1]', '[2]', '[3]', '[4]', '[5]'])
      .default('[2]')
      .describe("Pilih jawaban dari pertanyaan kedua: [1] Tidak pernah, [2] Jarang (1 kali), [3] Kadang-kadang (2 kali), [4] Sering (3-4 kali), [5] Sangat sering (5 kali atau lebih"),
      
    pertanyaan_3: z.enum(['[1]', '[2a]', '[2b]', '[3a]', '[3b]'])
      .default('[1]')
      .describe("Pilih jawaban dari pertanyaan ketiga: [1] Tidak, [2a] Ya, satu kali, tetapi tidak benar-benar ingin mati, [2b] Ya, satu kali, dan benar-benar ingin mati, [3a] Ya, lebih dari satu kali, tetapi tidak ingin melakukannya, [3b] Ya, lebih dari satu kali, dan benar-benar ingin melakukannya"),
      
    pertanyaan_4: z.enum(['[1]', '[2]', '[3]', '[4]', '[5]', '[6]', '[7]'])
      .default('[1]')
      .describe("Pilih jawaban dari pertanyaan keempat: [1] Tidak pernah, [2] Tidak ada kemungkinan, [3] Sangat tidak mungkin, [4] Tidak mungkin, [5] Mungkin, [6] Cukup mungkin, [7] Sangat mungkin")
  });
  
  

const analisaAgen = async (req, res)=>{
    const { nama, session } = req.body 
    try{
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            temperature: 0,
            maxRetries: 2,
        });
        const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `
            Berdasarkan riwayat percakapan dibawah, lakukan analisa lalu isi quesioner dan jawab pertanyaan dibawah berdasarkan riwayat percakapan tersebut.
            Pertanyaan 1 : Apakah yang bersangkutan/ narasumber pernah berpikir atau mencoba untuk bunuh diri?
            [1] Tidak pernah, [2] Hanya sekilas pemikiran yang lewat, [3a] Saya pernah memiliki rencana untuk bunuh diri tetapi tidak mencobanya, [3b] Saya pernah memiliki rencana untuk bunuh diri dan benar-benar ingin mati, [4a] Saya pernah mencoba bunuh diri, tetapi tidak ingin mati, [4b] Saya pernah mencoba bunuh diri dan benar-benar berharap untuk mati
            Pertanyaan 2 : Seberapa sering yang bersangkutan/ narasumber berpikir untuk bunuh diri dalam setahun terakhir? 
            [1] Tidak pernah, [2] Jarang (1 kali), [3] Kadang-kadang (2 kali), [4] Sering (3-4 kali), [5] Sangat sering (5 kali atau lebih)
            Pertanyaan 3 : Apakah yang bersangkutan/ narasumber pernah memberi tahu seseorang bahwa yang bersangkutan/ narasumber akan melakukan bunuh diri, atau bahwa yang bersangkutan/ narasumber mungkin melakukannya?
            [1] Tidak, [2a] Ya, satu kali, tetapi tidak benar-benar ingin mati, [2b] Ya, satu kali, dan benar-benar ingin mati, [3a] Ya, lebih dari satu kali, tetapi tidak ingin melakukannya, [3b] Ya, lebih dari satu kali, dan benar-benar ingin melakukannya
            Pertanyaan 4 : Seberapa mungkin yang bersangkutan/ narasumber akan mencoba bunuh diri suatu hari nanti?
            [1] Tidak pernah, [2] Tidak ada kemungkinan, [3] Sangat tidak mungkin, [4] Tidak mungkin, [5] Mungkin, [6] Cukup mungkin, [7] Sangat mungkin.
    
            jawab dengan memilih angka pada setiap pilihan jawabannya seperti contoh [2a], response dengan format JSON sesuai dengan schema yang diberikan 
    
            <chat history>
            {chat_history}
            </chat history>
    
            <JSON Answere>
            {format_instructions}
            </JSON>
            
            `,
        ],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ]);
    
        const parser = StructuredOutputParser.fromZodSchema(analyticsSchema);
        const filterMessages = (input) => input.chat_history.slice(-10);
    
        const chain = RunnableSequence.from([
            RunnablePassthrough.assign({
                chat_history: filterMessages,
                format_instructions: () => parser.getFormatInstructions(),
            }),
            prompt,
            model,
            parser
        ]);
    
        const chatHistory = [
            new AIMessage('Apakah yang bersangkutan/ narasumber pernah berpikir atau mencoba untuk bunuh diri?'),
            new HumanMessage('Hanya sekilas'),
            new AIMessage(' Seberapa sering yang bersangkutan/ narasumber berpikir untuk bunuh diri dalam setahun terakhir? '),
            new HumanMessage('Kadang-kadang'),
            new AIMessage(' Apakah yang bersangkutan/ narasumber pernah memberi tahu seseorang bahwa yang bersangkutan/ narasumber akan melakukan bunuh diri, atau bahwa yang bersangkutan/ narasumber mungkin melakukannya?'),
            new HumanMessage('Ya, lebih dari satu kali'),
            new AIMessage(' Seberapa mungkin yang bersangkutan/ narasumber akan mencoba bunuh diri suatu hari nanti?'),
            new HumanMessage('Tidak pernah'),
        ]
        const response = await chain.invoke({
            input: "Tolong analisa history chat ini ",
            chat_history : chatHistory
        });
        const data = await getPoints(response, nama, session)
        res.status(200).json({
            data, 
            message : 'Data Berhasil dianalisa'
        })
    }catch(err){
        res.status(500).json({
            data : [], 
            message : `Terjadi kesalahan pada server ${err.message}`
        })
    }
   
}

const getPoints = async(data, nama, session)=>{
    try {
        const rule = {
            pertanyaan_1: {
                '[1]': 1,
                '[2]': 2,
                '[3a]': 3,
                '[3b]': 3,
                '[4a]': 4,
                '[4b]': 4,
            },
            pertanyaan_2: {
                '[1]': 1,
                '[2]': 2,
                '[3]': 3,
                '[4]': 4,
                '[5]': 5,
            },
            pertanyaan_3: {
                '[1]': 1,
                '[2a]': 2,
                '[2b]': 2,
                '[3a]': 3,
                '[3b]': 3,
            },
            pertanyaan_4: {
                '[1]': 0,
                '[2]': 1,
                '[3]': 2,
                '[4]': 3,
                '[5]': 4,
                '[6]': 5,
                '[7]': 6,
            },
        };

        let score = 0;
        for (const [key, value] of Object.entries(data)) {
            score += rule[key][value];
        }

        let analisa = {
            nama, 
            session,
            ai_sensitivity : null, 
            ai_spesificity : null, 
            ai_ppv : null,  
            ai_auc : null, 
            uc_sensitivity : null, 
            uc_spesificity : null, 
            uc_ppv : null,  
            uc_auc : null, 
            score
        }
        if(score >= 2 ){
            analisa = {
                nama, 
                session,
                ai_sensitivity : 0.80, 
                ai_spesificity : 0.97, 
                ai_ppv : 0.95,  
                ai_auc : 0.92, 
                uc_sensitivity : 0.80, 
                uc_spesificity : 0.97, 
                uc_ppv : 0.95,  
                uc_auc : 0.92, 
                score
            }
        }
        if(score >= 7 ){
            analisa = {
                nama, 
                session,
                ai_sensitivity : null, 
                ai_spesificity : null, 
                ai_ppv : null,  
                ai_auc : null, 
                uc_sensitivity : 0.93, 
                uc_spesificity : 0.95, 
                uc_ppv : 0.70,  
                uc_auc : 0.96, 
                score
            }
        }
        if(score >= 8 ){
            analisa = {
                nama, 
                session,
                ai_sensitivity : 0.80, 
                ai_spesificity : 0.91, 
                ai_ppv : 0.87,  
                ai_auc : 0.89, 
                uc_sensitivity : null, 
                uc_spesificity : null, 
                uc_ppv : null,  
                uc_auc : null, 
                score
            }
        }

        await saveAnalisa(analisa)
        return result = {
            quisionarie : data,
            analisa,
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports = {
    analisaAgen
}