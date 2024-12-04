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
        // askAssistant(userInput); // Den her crasher serveren pga. invalid API key
    });
});

async function askAssistant(userInput) {
    try {
        loadAni();
        const responseDiv = document.querySelector(".bot_answer");

        const requestData = { question: userInput };
        console.log("Sending request data:", requestData); // Log the request data

        const response = await fetch("/ask-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
        });

        console.log("Received response:", response); // Log the response

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.statusText} - ${errorText}`);
        }

        // Read and stream response body in real-time
        const reader = response.body.getReader();
        let result = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder("utf-8").decode(value);
            result += chunk;
            responseDiv.textContent = result; // Update response as chunks arrive
        }
    } catch (error) {
        console.error("Error communicating with assistant:", error);
    } finally {
        stopLoadAni();
    }
}
