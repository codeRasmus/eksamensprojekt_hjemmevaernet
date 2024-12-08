"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";
import { loadAni, stopLoadAni } from "./modules/loadAni.js";
import { createLoginComponent } from "./modules/login.js";
import { formatUnix } from "./modules/formatUnix.js";

let currentThreadId = ""; // The current thread ID
let userName = document.getElementById("user_name").textContent;

document.addEventListener("DOMContentLoaded", () => {
  createLoginComponent("login-container");
  const increaseButton = document.getElementById("increaseFont");
  const decreaseButton = document.getElementById("decreaseFont");
  const chat = document.getElementById("chat");

  const scalingFactorUp = 1.1;
  const scalingFactorDown = 0.9;
  increaseButton.addEventListener("click", () => fontSizer(scalingFactorUp));
  decreaseButton.addEventListener("click", () => fontSizer(scalingFactorDown));

  const chatOversigt = document.querySelectorAll("#chat_oversigt");
  chatOversigt.forEach((chat) => {
    chat.addEventListener("click", () => showThreads());
  });

  document.getElementById("sendprompt_btn").addEventListener("click", () => {
    const userInput = document.getElementById("userprompt").value;
    console.log("User input:", userInput); // Log the user input
    if (userInput.trim() === "") {
      alert("Please enter a question.");
      return;
    }
    // Opdater UI og start loading
    chat.classList.add("show-username");
    document.getElementById("welcome-text").textContent = "";
    chat.style.width = "60%";
    askAssistant(userInput);

    const userMessagesDiv = document.querySelector("#chatbox");
    // Create a new div for the response
    const newDiv = document.createElement("div");
    newDiv.classList.add("user_question");
    userMessagesDiv.appendChild(newDiv);
    newDiv.textContent = userInput;
  });
});

async function askAssistant(userInput) {
  try {
    document.getElementById("userprompt").value = "";
    loadAni();

    const requestData = {
      question: userInput,
      currentThread: currentThreadId, // Ensure this is set correctly
      userName: userName,
    };
    console.log("Sending request data:", requestData);

    const response = await fetch("/ask-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = "";
    const messagesDiv = document.querySelector("#chatbox");

    // Create a new div for the response
    const newDiv = document.createElement("div");
    newDiv.classList.add("bot_answer");
    messagesDiv.appendChild(newDiv);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      content += chunk;

      const lines = content.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          let text = line.slice(6); // Remove "data: " prefix
          if (text === "[DONE]") {
            text = "";
            return; // Stop processing when [DONE] is received
          }
          newDiv.textContent += text; // Append the chunk to the new div
        }
      }
      // Clear content to avoid duplicating chunks
      content = "";
    }
  } catch (error) {
    console.error("Error communicating with assistant:", error);
    alert(`An error occurred: ${error.message}`);
  } finally {
    stopLoadAni();
  }
}

async function showThreads() {
  console.log("Fetching threads...");

  const response = await fetch("/getThreads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: userName }),
  });
  if (!response.ok) {
    throw new Error(`Error fetching threads: ${response.status}`);
  }
  const data = await response.json();
  const threadsContainer = document.getElementById("threads_container");
  threadsContainer.innerHTML = "";
  console.log(data.threads);
  let threads = data.threads;

  threads.forEach((thread) => {
    const threadDiv = document.createElement("div");
    threadDiv.classList.add("thread");
    threadDiv.innerHTML = `${formatUnix(thread.created_at)}`;
    threadsContainer.appendChild(threadDiv);
    threadDiv.addEventListener("click", async () => {
      currentThreadId = thread;
      messageResponse = await fetch("/getThreadMessages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: thread }),
      });
    });
  });
}
