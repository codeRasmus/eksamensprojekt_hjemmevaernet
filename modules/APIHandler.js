import OpenAI from "openai";
import dotenv from "dotenv";

// Initialize OpenAI client
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const organization = process.env.OPENAI_ORG_ID;

if (!apiKey) {
    throw new Error("The OPENAI_API_KEY environment variable is missing or empty.");
}

if (!organization) {
    throw new Error("The OPENAI_ORG_ID environment variable is missing or empty.");
}

const openai = new OpenAI({
    apiKey: apiKey,
    organization: organization,
});

let assistantId;
let threadId;

// Initialize Assistant and Thread (if not already initialized)
async function initializeAssistantAndThread() {
    try {
        if (!assistantId) {
            console.log("Creating new assistant...");
            const assistant = await openai.beta.assistants.create({
                name: "ChatBot",
                instructions: "You are a helper for volunteer tutors at 'Hjemmeværnsskolen'.",
                tools: [{ type: "file_search" }],
                model: "gpt-4o-mini",
            });
            assistantId = assistant.id;
            console.log("Assistant created with ID:", assistantId);
        }
        if (!threadId) {
            console.log("Creating new thread...");
            const thread = await openai.beta.threads.create();
            threadId = thread.id;
            console.log("Thread created with ID:", threadId);
        }
    } catch (error) {
        console.error("Error initializing assistant and thread:", error);
        throw error;
    }
}

// Process user message and stream assistant's response
export async function processUserMessage(question, onTextDelta) {
    try {
        console.log("Initializing assistant and thread...");
        await initializeAssistantAndThread();

        console.log("Adding user message to thread...");
        // Add user message to thread
        await openai.beta.messages.create(threadId, { role: "user", content: question });

        console.log("Streaming assistant response...");
        // Stream assistant response
        const run = await openai.beta.threads.runs.stream(threadId, { assistant_id: assistantId })
            .on("textDelta", textDelta => {
                if (onTextDelta) onTextDelta(textDelta.value); // Send chunk to server
            });

        return run;
    } catch (error) {
        console.error("Error processing user message:", error);
        throw new Error("Failed to process user message");
    }
}