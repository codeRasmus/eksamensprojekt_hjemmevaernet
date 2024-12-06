"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";
import { storeDataLocal } from "./modules/storageModule.js"; // Need restructuring
import { loadAni, stopLoadAni } from "./modules/loadAni.js";
import { createLoginComponent } from "./modules/login.js";

document.addEventListener("DOMContentLoaded", () => {
    createLoginComponent("login-container");
    const increaseButton = document.getElementById("increaseFont");
    const decreaseButton = document.getElementById("decreaseFont");

    const scalingFactorUp = 1.1;
    const scalingFactorDown = 0.9;

    increaseButton.addEventListener("click", () => fontSizer(scalingFactorUp));
    decreaseButton.addEventListener("click", () => fontSizer(scalingFactorDown));

    document.getElementById("sendprompt_btn").addEventListener("click", () => {
        const userInput = document.getElementById("userprompt").value;
        console.log("User input:", userInput); // Log the user input
        if (userInput.trim() === "") {
            alert("Please enter a question.");
            return;
        }
        document.querySelector(".user_question").textContent = userInput;
        document.getElementById("chat").classList.add("show-username");
        askAssistant(userInput); // Den her crasher serveren pga. invalid API key
    });
});

async function askAssistant(userInput) {
    try {
        loadAni();

        const requestData = { question: userInput };
        console.log("Sending request data:", requestData);

        const response = await fetch("/ask-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = '';
        const messagesDiv = document.querySelector(".bot_answer");

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            content += chunk;

            const lines = content.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const text = line.slice(5); // Remove "data: " prefix
                    if (text === '[DONE]') return;
                    messagesDiv.innerHTML += `<span>${text}</span>`;
                }
            }
        }
    } catch (error) {
        console.error("Error communicating with assistant:", error);
        alert(`An error occurred: ${error.message}`);
        responseDiv.textContent = "There was an error with the request.";
    } finally {
        stopLoadAni();
    }
}
