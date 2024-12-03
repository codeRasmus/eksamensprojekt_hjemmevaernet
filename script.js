"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";
import { handleUserPrompt } from "./modules/promptHandler.js";
import { storeDataLocal } from "./modules/storageModule.js"; // Need resturcturing
import { loadAni, stopLoadAni } from "./modules/loadAni.js";
// import { createAssistant, createThread, createMessage, createRun } from "./modules/APIHandler.js";
import { createLoginComponent } from "./modules/login.js";

document.addEventListener("DOMContentLoaded", () => {
    createLoginComponent("login-container");
    const increaseButton = document.getElementById("increaseFont");
    const decreaseButton = document.getElementById("decreaseFont");

    const scalingFactorUp = 1.1;
    const scalingFactorDown = 0.9;

    increaseButton.addEventListener("click", () => fontSizer(scalingFactorUp));
    decreaseButton.addEventListener("click", () => fontSizer(scalingFactorDown));

    handleUserPrompt("userprompt", "sendprompt_btn");

    document.getElementById("sendprompt_btn").addEventListener("click", () => {
        const userInput = document.getElementById("userprompt").value;
        askAssistant(userInput);
    });
});

// Send user input to the server and display the assistant's response
async function askAssistant(userInput) {
    try {
        loadAni();
        const responseDiv = document.getElementById("bot_answers");

        const response = await fetch("/ask-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: userInput }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        // Read and stream response body in real-time
        const reader = response.body.getReader();
        let result = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder("utf-8").decode(value);
            result += chunk;
            responseDiv.innerText = result; // Update response as chunks arrive
        }
    } catch (error) {
        console.error("Error communicating with assistant:", error);
    } finally {
        stopLoadAni();
    }
}