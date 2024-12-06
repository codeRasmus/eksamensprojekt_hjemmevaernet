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
    const responseDiv = document.querySelector(".bot_answer");

    const requestData = { question: userInput };
    console.log("Sending request data:", requestData);

    const response = await fetch("/ask-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    console.log("Raw response:", response);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Server error: ${response.status} - ${response.statusText} - ${errorText}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
    
      // Akkumulér tekst i buffer
      buffer += decoder.decode(value, { stream: true });
    
      let boundary;
      while ((boundary = buffer.indexOf("\n")) !== -1) {
        const chunk = buffer.slice(0, boundary).trim(); // Få teksten før "\n"
        buffer = buffer.slice(boundary + 1); // Fjern behandlet chunk
    
        if (chunk) {
          // Parse chunk og opdater DOM'en
          try {
            const parsedChunk = JSON.parse(chunk);
            console.log("Parsed chunk:", parsedChunk);
    
            // Tilføj teksten til DOM'en med en mellemrum for at sikre korrekt formatering
            responseDiv.textContent += parsedChunk.response + " ";
          } catch (error) {
            console.error("Failed to parse chunk:", chunk, error);
          }
        }
      }
    }
    
    
} catch (error) {
    console.error("Error communicating with assistant:", error);
    alert(`An error occurred: ${error.message}`);
  } finally {
    stopLoadAni();
  }
}

