"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";
import { handleUserPrompt } from "./modules/promptHandler.js";
import { storeDataLocal } from "./modules/storageModule.js"; // Need resturcturing
import { loadAni, stopLoadAni } from "./modules/loadAni.js";
import { createAssistant, createThread, createMessage, createRun } from "./modules/APIHandler.js";

document.addEventListener("DOMContentLoaded", () => {
    const increaseButton = document.getElementById("increaseFont");
    const decreaseButton = document.getElementById("decreaseFont");

    const scalingFactorUp = 1.1;
    const scalingFactorDown = 0.9;

    increaseButton.addEventListener("click", () => fontSizer(scalingFactorUp));
    decreaseButton.addEventListener("click", () => fontSizer(scalingFactorDown));

    handleUserPrompt("userprompt", "sendprompt_btn");

    loadAni();
    main();
});

async function main() {
    try {
        // #1: Set up assistant and thread
        const assistantId = await createAssistant();
        const threadId = await createThread();

        // #2: Send user's message
        await createMessage(threadId, question);

        // #3: Start streaming the assistant's response
        await createRun(
            threadId,
            assistantId,
            // Callback for real-time text updates
            (textChunk) => {
                console.log("Text chunk received:", textChunk);
                const responseDiv = document.getElementById("assistant-response");
                responseDiv.innerText += textChunk; // Update UI incrementally
            },
            // Callback for tool usage
            (toolCall) => {
                console.log("Tool called:", toolCall.type);
                // Handle tool-specific logic if needed
            },
            // Callback for file search results
            (fileSearchResults) => {
                console.log("File search results:", fileSearchResults);
                const resultsDiv = document.getElementById("file-search-results");
                resultsDiv.innerHTML = fileSearchResults
                    .map(result => `<li>${result.name}</li>`)
                    .join(""); // Display results in a list
            }
        );
    } catch (error) {
        console.error("Error interacting with assistant:", error);
    } finally {
        stopLoadAni();
    }
}

async function fetchData() {
    // fake a fetch call
    return new Promise((resolve) => setTimeout(resolve, 2000));
}