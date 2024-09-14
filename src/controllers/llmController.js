const { ChatOpenAI } = require("@langchain/openai");
require("cheerio");
const { CheerioWebBaseLoader } = require("@langchain/community/document_loaders/web/cheerio");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");

const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const {
  ChatPromptTemplate,
  MessagesPlaceholder,
} = require("@langchain/core/prompts");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");

const {
  RunnablePassthrough,
  RunnableSequence,
} = require("@langchain/core/runnables");

const { RunnableBranch } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");


const chatAvatar = async (req, res) => {
    try{
        const llm = new ChatOpenAI({
            model: "gpt-4o-mini",
            temperature: 0
        });

        const loader = new CheerioWebBaseLoader(
            "https://docs.smith.langchain.com/user_guide"
        );
        const rawDocs = await loader.load();
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 0,
        });
        
        const allSplits = await textSplitter.splitDocuments(rawDocs);

        const vectorstore = await MemoryVectorStore.fromDocuments(
            allSplits,
            new OpenAIEmbeddings()
        );

        const retriever = vectorstore.asRetriever(4);
        // const docs = await retriever.invoke("how can langsmith help with testing?");




        const SYSTEM_TEMPLATE = `Answer the user's questions based on the below context. 
        If the context doesn't contain any relevant information to the question, don't make something up and just say "I don't know":

        <context>
        {context}
        </context>
        `;

        const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_TEMPLATE],
        new MessagesPlaceholder("messages"),
        ]);

        const documentChain = await createStuffDocumentsChain({
            llm,
            prompt: questionAnsweringPrompt,
        });

        // await documentChain.invoke({
        //     messages: [new HumanMessage("Can LangSmith help test my LLM applications?")],
        //     context: docs,
        // });


        const parseRetrieverInput = (params) => {
            return params.messages[params.messages.length - 1].content;
          };
          
          const retrievalChain = RunnablePassthrough.assign({
            context: RunnableSequence.from([parseRetrieverInput, retriever]),
          }).assign({
            answer: documentChain,
          });

          await retrievalChain.invoke({
            messages: [new HumanMessage("Can LangSmith help test my LLM applications?")],
          });
  



          const queryTransformPrompt = ChatPromptTemplate.fromMessages([
            new MessagesPlaceholder("messages"),
            [
              "user",
              "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation. Only respond with the query, nothing else.",
            ],
          ]);
          
          const queryTransformationChain = queryTransformPrompt.pipe(llm);
          
          await queryTransformationChain.invoke({
            messages: [
              new HumanMessage("Can LangSmith help test my LLM applications?"),
              new AIMessage(
                "Yes, LangSmith can help test and evaluate your LLM applications. It allows you to quickly edit examples and add them to datasets to expand the surface area of your evaluation sets or to fine-tune a model for improved quality or reduced costs. Additionally, LangSmith can be used to monitor your application, log all traces, visualize latency and token usage statistics, and troubleshoot specific issues as they arise."
              ),
              new HumanMessage("Tell me more!"),
            ],
          });
        

          const queryTransformingRetrieverChain = RunnableBranch.from([
            [
              (params) => params.messages.length === 1,
              RunnableSequence.from([parseRetrieverInput, retriever]),
            ],
            queryTransformPrompt.pipe(llm).pipe(new StringOutputParser()).pipe(retriever),
          ]).withConfig({ runName: "chat_retriever_chain" });


          const conversationalRetrievalChain = RunnablePassthrough.assign({
            context: queryTransformingRetrieverChain,
          }).assign({
            answer: documentChain,
          });


          await conversationalRetrievalChain.invoke({
            messages: [
              new HumanMessage("Can LangSmith help test my LLM applications?"),
              new AIMessage(
                "Yes, LangSmith can help test and evaluate your LLM applications. It allows you to quickly edit examples and add them to datasets to expand the surface area of your evaluation sets or to fine-tune a model for improved quality or reduced costs. Additionally, LangSmith can be used to monitor your application, log all traces, visualize latency and token usage statistics, and troubleshoot specific issues as they arise."
              ),
              new HumanMessage("Tell me more!"),
            ],
          });

        res.status(200).json({
            message : "Berikut data menu makan", 
            data : []
        })
    }catch(err){
        res.status(500).json({
            message : "Internal server error", 
            data : []
        })
    }
}

module.exports = {
    chatAvatar
}