"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";
import { storeDataLocal } from "./modules/storageModule.js"; // Need restructuring
import { loadAni, stopLoadAni } from "./modules/loadAni.js";
import { createLoginComponent } from "./modules/login.js";
import { chatDialogue } from "./modules/chatDialogue.js";

document.addEventListener("DOMContentLoaded", () => {
  createLoginComponent("login-container");
  const increaseButton = document.getElementById("increaseFont");
  const decreaseButton = document.getElementById("decreaseFont");
  const chat = document.getElementById("chat");

  const scalingFactorUp = 1.1;
  const scalingFactorDown = 0.9;

  increaseButton.addEventListener("click", () => fontSizer(scalingFactorUp));
  decreaseButton.addEventListener("click", () => fontSizer(scalingFactorDown));

  document.getElementById("sendprompt_btn").addEventListener("click", async () => {
      const userInput = document.getElementById("userprompt").value;

      if (userInput.trim() === "") {
          alert("Please enter a question.");
          return;
      }

      // Opdater UI og start loading
      chat.classList.add("show-username");
      document.getElementById("welcome-text").textContent = "";
      chat.style.width = "60%";

      // Tilføj brugerens besked til chatbox
      chatDialogue("Andreas", userInput);

      // Vent på chatbot-svaret
      await askAssistant(userInput);
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

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
              `Server error: ${response.status} - ${response.statusText} - ${errorText}`
          );
      }

      // Stream læsning
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // Opret en midlertidig besked i chatboxen
      const tempMessageId = `chatbot-temp-${Date.now()}`; // Unik ID for midlertidig besked
      const chatbox = document.getElementById("chatbox");
      const tempMessageWrapper = document.createElement("div");
      tempMessageWrapper.className = "chatMessage";
      tempMessageWrapper.id = tempMessageId;

      const senderName = document.createElement("span");
      senderName.textContent = "Verner";
      senderName.className = "senderName";

      const messageText = document.createElement("p");
      messageText.textContent = ""; // Start tomt, tilføjer løbende

      tempMessageWrapper.appendChild(senderName);
      tempMessageWrapper.appendChild(messageText);
      chatbox.appendChild(tempMessageWrapper);

      while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let boundary;
          while ((boundary = buffer.indexOf("\n")) !== -1) {
              const chunk = buffer.slice(0, boundary).trim(); // Få teksten før "\n"
              buffer = buffer.slice(boundary + 1); // Fjern behandlet chunk

              if (chunk) {
                  try {
                      const parsedChunk = JSON.parse(chunk);
                      console.log("Parsed chunk:", parsedChunk);

                      // Opdater den midlertidige besked
                      if (parsedChunk.response) {
                          const tempMessage = document.getElementById(tempMessageId);
                          if (tempMessage) {
                              const tempText = tempMessage.querySelector("p");
                              tempText.textContent += parsedChunk.response;
                          }
                      }
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

