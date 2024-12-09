"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";
import { loadAni, stopLoadAni } from "./modules/loadAni.js";
import { createLoginComponent } from "./modules/login.js";
import { formatUnix } from "./modules/formatUnix.js";

let userName = document.getElementById("user_name").textContent;

function setCurrentThreadId(threadId) {
  sessionStorage.setItem("currentThreadId", threadId);
}

function getCurrentThreadId() {
  return sessionStorage.getItem("currentThreadId");
}

function updateUserName(name) {
  userName = name; // Update the global userName variable
  document.getElementById("user_name").textContent = name;
  document.documentElement.style.setProperty("--userName", `"${name}"`);
}

document.addEventListener("DOMContentLoaded", () => {
  createLoginComponent("login-container", updateUserName);
  const chat = document.getElementById("chat");
  const newChatBtn = document.getElementById("start_chat_button");
  newChatBtn.addEventListener("click", () => {
    document.getElementById("chatbox").innerHTML = "";
    document.getElementById("welcome-text").style.display = "block";
    setCurrentThreadId(""); // Reset current thread ID
  });
  const chatOversigt = document.querySelectorAll("#chat_oversigt");
  chatOversigt.forEach((chat) => {
    chat.addEventListener("click", () => showThreads());
  });
  document
    .getElementById("sendprompt_btn")
    .addEventListener("click", handleInput);
  document.getElementById("userprompt").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleInput();
    }
  });

  function handleInput() {
    const userInput = document.getElementById("userprompt").value;
    console.log("User input:", userInput); // Log the user input
    if (userInput.trim() === "") {
      alert("Please enter a question.");
      return;
    }
    // Opdater UI og start loading
    chat.classList.add("show-username");
    document.getElementById("welcome-text").style.display = "none";
    chat.style.width = "60%";
    askAssistant(userInput);

    const userMessagesDiv = document.querySelector("#chatbox");
    // Create a new div for the response
    const newDiv = document.createElement("div");
    newDiv.classList.add("user_question");
    userMessagesDiv.appendChild(newDiv);
    newDiv.textContent = userInput;
  }

  const increaseButton = document.getElementById("increaseFont");
  const decreaseButton = document.getElementById("decreaseFont");
  const scalingFactorUp = 1.1;
  const scalingFactorDown = 0.9;
  increaseButton.addEventListener("click", () => fontSizer(scalingFactorUp));
  decreaseButton.addEventListener("click", () => fontSizer(scalingFactorDown));
});

async function askAssistant(userInput) {
  try {
    document.getElementById("userprompt").value = "";
    const chatbox = document.getElementById("chatbox");
    loadAni();

    if (chatbox.innerHTML === "") {
      setCurrentThreadId("");
      console.log("Thread er ingenting");
    }

    const requestData = {
      question: userInput,
      currentThread: getCurrentThreadId(), // Ensure this is set correctly
      userName: userName, // Ensure userName is passed correctly
    };
    console.log("Sending request data:", requestData);

    const response = await fetch("/ask-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    // Get the thread ID from the response headers
    setCurrentThreadId(response.headers.get("Thread-Id"));

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
          if (text.startsWith("[TOOL CALL]")) {
            console.log("Tool call event:", text);
          } else {
            newDiv.textContent += text; // Append the chunk to the new div
          }
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
  const arrowDown = document.getElementById("arrow_down");
  threadsContainer.innerHTML = "";
  threadsContainer.classList.toggle("active");
  arrowDown.classList.toggle("active");
  console.log(data.threads);
  let threads = data.threads;

  threads.forEach((thread) => {
    const threadDiv = document.createElement("div");
    threadDiv.classList.add("thread");
    threadDiv.innerHTML = `${formatUnix(thread.created_at)}`;
    threadsContainer.appendChild(threadDiv);

    threadDiv.addEventListener("mouseenter", function () {
      this.style.fontWeight = "bold";
      this.style.textDecoration = "underline";
      this.style.color = "var(--red)";
      this.style.backgroundColor = "var(--darkerGrey)";
    });

    threadDiv.addEventListener("mouseleave", function () {
      this.style.fontWeight = "normal";
      this.style.textDecoration = "none";
      this.style.color = "var(--black)";
      this.style.backgroundColor = "inherit";
    });

    threadDiv.addEventListener("click", async () => {
      try {
        console.log("Fetching messages for thread ID:", thread.id);
        setCurrentThreadId(thread.id);
        const messageResponse = await fetch("/getThreadMessages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: thread.id }),
        });
        if (!messageResponse.ok) {
          throw new Error(`Error fetching messages: ${messageResponse.status}`);
        }
        // Opdater UI og start loading
        chat.classList.add("show-username");
        document.getElementById("welcome-text").style.display = "none";
        chat.style.width = "60%";
        const messages = await messageResponse.json();
        const chatbox = document.getElementById("chatbox");
        chatbox.innerHTML = "";
        messages.messages.forEach((message) => {
          const messageDiv = document.createElement("div");
          messageDiv.classList.add(
            message.role === "user" ? "user_question" : "bot_answer"
          );
          messageDiv.textContent = message.text;
          chatbox.appendChild(messageDiv);
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    });
  });

  threadsContainer.addEventListener("click", () => {
    threadsContainer.classList.toggle("active");
    arrowDown.classList.toggle("active");
  });
}
