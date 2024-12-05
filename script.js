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

    const responseText = await response.text();
    console.log("Received text response:", responseText);

    try {
      const responseData = JSON.parse(responseText);
      console.log("Parsed response data:", responseData);

      if (responseData && responseData.response) {
        responseDiv.textContent = responseData.response;
      } else {
        responseDiv.textContent = "No answer received from the server.";
      }
    } catch (error) {
      console.error("Error parsing response:", error);
      responseDiv.textContent = "Invalid response format.";
    }
  } catch (error) {
    console.error("Error communicating with assistant:", error);
    alert(`An error occurred: ${error.message}`);
    responseDiv.textContent = "There was an error with the request.";
  } finally {
    stopLoadAni();
  }
}
