"use strict";
// MODULE IMPORTS
import { fontSizer } from "./modules/fontSizer.js";
import { loadAni, stopLoadAni } from "./modules/loadAni.js";
import { createLoginComponent } from "./modules/login.js";
import { formatUnix } from "./modules/formatUnix.js";
import { toggleBurgerMenu } from "./modules/burgerMenu.js";

let userName = document.getElementById("user_name").textContent;

function setCurrentThreadId(threadId) {
  sessionStorage.setItem("currentThreadId", threadId); // Gem den aktuelle tråd ID i sessionStorage
}

function getCurrentThreadId() {
  return sessionStorage.getItem("currentThreadId"); // Hent den aktuelle tråd ID fra sessionStorage
}

function updateUserName(name) {
  userName = name; // Opdater den globale userName variabel
  document.getElementById("user_name").textContent = name;
  document.documentElement.style.setProperty("--userName", `"${name}"`); // Opdater CSS variabel
}

function scrollToBottom() {
  const chatbox = document.getElementById("chatbox");
  chatbox.scrollTop = chatbox.scrollHeight; // Scroll til bunden af chatboxen
}

document.addEventListener("DOMContentLoaded", () => {
  createLoginComponent("login-container", updateUserName); // Opret login komponent
  toggleBurgerMenu(); // Toggle burger menu
  const chat = document.getElementById("chat"); 
  const newChatBtn = document.getElementById("start_chat_button"); 
  newChatBtn.addEventListener("click", () => {  
    console.log("Ny chat startet");
    document.getElementById("chatbox").innerHTML = "";
    document.getElementById("welcome-text").style.display = "block";
    document.getElementById("current-chat-title").style.display = "none"; // Ryd den aktuelle chat titel
    setCurrentThreadId(""); // Nulstil nuværende tråd ID
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
    } // Håndter brugerinput ved Enter-tast
  });

  function handleInput() {
    const userInput = document.getElementById("userprompt").value;
    console.log("Input modtaget", userInput); // Log brugerinput
    if (userInput.trim() === "") {
      alert("Please enter a question.");
      return;
    }
    // Opdater UI og start loading
    chat.classList.add("show-username");
    document.getElementById("welcome-text").style.display = "none";

    askAssistant(userInput);

    const userMessagesDiv = document.querySelector("#chatbox");
    // Opret en ny div til svaret
    const newDiv = document.createElement("div");
    newDiv.classList.add("user_question");
    userMessagesDiv.appendChild(newDiv);
    newDiv.textContent = userInput;
    scrollToBottom(); // Scroll til bunden efter at have tilføjet brugerinput
  }

  // Fontstørrelse justering
  const increaseButton = document.getElementById("increaseFont");
  const decreaseButton = document.getElementById("decreaseFont");
  const scalingFactorUp = 1.1;
  const scalingFactorDown = 0.9;
  increaseButton.addEventListener("click", () => fontSizer(scalingFactorUp));
  decreaseButton.addEventListener("click", () => fontSizer(scalingFactorDown));

  // Materialer oversigt
  const materialerOversigt = document.getElementById("materialer_oversigt");
  materialerOversigt.addEventListener("click", () =>
    showMaterialer(materialerOversigt)
  );
});

async function askAssistant(userInput) {
  try {
    document.getElementById("userprompt").value = "";
    const chatbox = document.getElementById("chatbox");
    loadAni();

    if (chatbox.innerHTML === "") {
      setCurrentThreadId("");
    }

    const requestData = {
      question: userInput,
      currentThread: getCurrentThreadId(), // Sørg for at dette er sat korrekt
      userName: userName, // Sørg for at userName sendes korrekt
    };
    console.log("Sender request data:", requestData);

    const response = await fetch("/ask-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    // Få tråd ID fra svar headers
    setCurrentThreadId(response.headers.get("Thread-Id"));

    const reader = response.body.getReader(); // Opret en reader til at læse svaret
    const decoder = new TextDecoder(); // Opret en decoder til at dekode svaret
    let content = ""; // Opret en variabel til at samle svaret
    const messagesDiv = document.querySelector("#chatbox"); // Hent chatboxen
    let finalResponse = ""; // Opret en variabel til at samle det endelige svar
 
    // Opret en ny div til svaret
    const newDiv = document.createElement("div");
    newDiv.classList.add("bot_answer");
    messagesDiv.appendChild(newDiv);

    while (true) {
      const { value, done } = await reader.read(); // Læs svaret fra readeren
      if (done) break; // Hvis vi er færdige, bryd løkken

      const chunk = decoder.decode(value, { stream: true }); // Dekod svaret
      content += chunk; // Saml svaret i content

      const lines = content.split("\n"); // Del svaret op i linjer
      for (const line of lines) { 
        if (line.startsWith("data: ")) {
          let text = line.slice(6); // Fjern "data: " prefix

          if (text === "[DONE]") {
            // Når vi er færdige, tilpas Markdown-strukturen
            finalResponse = finalResponse
              .replace(/(\d+)\.(\s*\*\*)/g, "**$1.**$2") // Inkluder tal og punktum indenfor **
              .replace(/(#+)/g, "\n$1") // Sikr linjeskift før headings
              .replace(/- /g, "\n- "); // Sikr linjeskift før listeelementer
            console.log("Indsætter svar:", finalResponse);
            newDiv.innerHTML = marked.parse(finalResponse); // Parse med marked
            return;
          }

          if (!text.startsWith("[TOOL CALL]")) {
            finalResponse += text; // Saml teksten i finalResponse
            newDiv.innerHTML += text; // Opdater løbende med rå tekst
          }
        }
      }
      content = ""; // Nulstil content
      scrollToBottom(); // Scroll til bunden efter at have modtaget bot svar
    }
  } catch (error) {
    console.error("Fejl ved kommunikation med assistent:", error);
    alert(`En fejl opstod: ${error.message}`);
  } finally {
    stopLoadAni(); // Stop indlæsningsanimationen
  }
}

async function showThreads() {
  // Send en POST anmodning til serveren for at hente tråde
  const response = await fetch("/getThreads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName: userName }), // Send brugernavnet som JSON
  });

  // Håndter fejl ved hentning af tråde
  if (!response.ok) {
    throw new Error(`Fejl ved hentning af tråde: ${response.status}`);
  }

  // Parse JSON data fra serverens svar
  const data = await response.json();

  // Log trådene hvis der er nogen, ellers log en besked om ingen tråde
  if (data.threads.length > 0) {
    console.log("Henter tråde:", data.threads);
  } else {
    console.log("Endnu ingen tråde tilknyttet denne bruger");
  }

  // Hent tråd-containeren og pilen fra DOM'en
  const threadsContainer = document.getElementById("threads_container");
  const arrowDown = document.getElementById("arrow_down");

  // Ryd tråd-containeren og skift synligheden
  threadsContainer.innerHTML = "";
  threadsContainer.classList.toggle("active");
  arrowDown.classList.toggle("active");

  // Gem trådene i en variabel
  let threads = data.threads;

  // Iterer over hver tråd og opret et div element for det
  threads.forEach((thread) => {
    const threadDiv = document.createElement("div");
    threadDiv.classList.add("thread");
    threadDiv.innerHTML = `${formatUnix(thread.created_at)}`; // Formater og vis trådens oprettelsesdato
    threadsContainer.appendChild(threadDiv); // Tilføj tråden til tråd-containeren

    // Tilføj event listener for mouseenter for at ændre stil ved hover
    threadDiv.addEventListener("mouseenter", function () {
      this.style.fontWeight = "bold";
      this.style.textDecoration = "underline";
      this.style.color = "var(--red)";
      this.style.backgroundColor = "var(--darkerGrey)";
    });

    // Tilføj event listener for mouseleave for at nulstille stil når musen forlader
    threadDiv.addEventListener("mouseleave", function () {
      if (!this.classList.contains("active")) {
        this.style.fontWeight = "normal";
        this.style.textDecoration = "none";
        this.style.color = "var(--black)";
        this.style.backgroundColor = "inherit";
      }
    });

    // Tilføj event listener for click for at hente beskeder for den valgte tråd
    threadDiv.addEventListener("click", async () => {
      try {
        // Fjern aktiv klasse fra alle tråde
        document
          .querySelectorAll(".thread")
          .forEach((el) => el.classList.remove("active"));
        // Tilføj aktiv klasse til den klikkede tråd
        threadDiv.classList.add("active");

        console.log("Henter beskeder for tråd ID:", thread.id);
        setCurrentThreadId(thread.id); // Sæt den aktuelle tråd ID
        const messageResponse = await fetch("/getThreadMessages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: thread.id }), // Send tråd ID som JSON
        });
        if (!messageResponse.ok) {
          throw new Error(`Fejl ved hentning af beskeder: ${messageResponse.status}`);
        }
        // Opdater UI og start loading
        chat.classList.add("show-username");
        document.getElementById("welcome-text").style.display = "none";

        const messages = await messageResponse.json(); // Parse JSON data fra serverens svar
        const chatbox = document.getElementById("chatbox");
        chatbox.innerHTML = ""; // Ryd chatboxen før indlæsning af nye beskeder
        messages.messages.forEach((message) => {
          const messageDiv = document.createElement("div");
          messageDiv.classList.add(
            message.role === "user" ? "user_question" : "bot_answer"
          ); // Tilføj enten user_question eller bot_answer klasse
          messageDiv.textContent = message.text;
          // Når vi er færdige, tilpas Markdown-strukturen
          messageDiv.textContent = messageDiv.textContent
            .replace(/(\d+)\.(\s*\*\*)/g, "**$1.**$2") // Inkluder tal og punktum indenfor **
            .replace(/(#+)/g, "\n$1") // Sikr linjeskift før headings
            .replace(/- /g, "\n- "); // Sikr linjeskift før listeelementer

          messageDiv.innerHTML = marked.parse(messageDiv.textContent); // Parse med marked
          chatbox.appendChild(messageDiv);
          scrollToBottom(); // Scroll til bunden efter indlæsning af beskeder
        });

        // Sæt den aktuelle chat titel
        const currentChatTitle = document.getElementById("current-chat-title");
        currentChatTitle.textContent = `${formatUnix(thread.created_at)}`;
        currentChatTitle.style.display = "block";
      } catch (error) {
        console.error("Fejl ved hentning af beskeder:", error);
      }
    });
  });

  // Tilføj event listener for at skifte synligheden af tråd-containeren
  threadsContainer.addEventListener("click", () => {
    threadsContainer.classList.toggle("active");
    arrowDown.classList.toggle("active");
  });
}

function showMaterialer(materialerOversigt) {
  const materialerContainer = document.getElementById("materialer_container");
  const arrowDown = materialerOversigt.querySelector("#arrow_down");

  // Skift den aktive klasse for at vise/skjule materialer containeren
  materialerContainer.classList.toggle("active");
  arrowDown.classList.toggle("active");

  // Tjek om materialer containeren er tom før den fyldes
  if (materialerContainer.innerHTML === "") {
    const materials = [
      {
        name: "Didaktiske Design Overvejelser",
        url: "./files/Didaktiske-Design-Overvejelser.pdf",
      },
      { name: "Faglærer i Hæren", url: "./files/Faglaerer-i-Haeren.pdf" },
      {
        name: "Instruktørvirke i Forsvaret",
        url: "./files/Instruktoervirke-i-Forsvaret.pdf",
      },
    ];

    console.log("Henter materialer:", materials);

    // Iterer over hvert materiale og opret et div element for det
    materials.forEach((material) => {
      const materialDiv = document.createElement("div");
      materialDiv.classList.add("materiale_item");
      materialDiv.textContent = material.name;

      // Tilføj click event for at åbne materialet i en ny fane
      materialDiv.addEventListener("click", () => {
        window.open(material.url, "_blank");
      });

      // Tilføj materialet div til materialer containeren
      materialerContainer.appendChild(materialDiv);
    });
  }
}
