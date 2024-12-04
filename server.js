"use strict";
const http = require("http"),
  path = require("path"),
  fs = require("fs"),
  dotenv = require("dotenv"),
  OpenAI = require("openai");

// Load environment variables
dotenv.config();
const port = 3000;
const hostname = "127.0.0.1";

const mime = {
  ".js": "application/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".json": "application/json",
  ".xml": "application/xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".zip": "application/zip",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Starter serveren
server.listen(port, hostname, function () {
  console.log("Lokalserveren kører");
});

// Udfører serverens opgave
async function callback(request, response) {

  // Håndterer login
  if (request.method === "POST" && request.url === "/login") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    request.on("end", () => {
      try {
        const { name, password } = JSON.parse(body); // Parse JSON-body
        const isValid = validateLogin(name, password); // Valider login

        if (isValid) {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ success: true }));
        } else {
          response.writeHead(401, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ success: false }));
        }
      } catch (error) {
        console.error("Fejl ved behandling af login:", error);
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ success: false, error: "Invalid JSON input" }));
      }
    });

    return; // Stop yderligere behandling for denne forespørgsel
  }

  // Handle assistant query endpoint
  if (request.method === "POST" && request.url === "/ask-assistant") {
    console.log("Received assistant query");
    let body = "";
    request.on("data", (chunk) => (body += chunk.toString())); // Collect data chunks from the request

    request.on("end", async () => {
      try {
        console.log("Received body:", body); // Log the received body
        const { question } = JSON.parse(body); // Parse the JSON body to extract the question
        if (!question) {
          response.writeHead(400, { "Content-Type": "application/json" }); // Respond with 400 if question is missing
          return response.end(JSON.stringify({ error: "Question is required" }));
        }

        // Initialize OpenAI client
        dotenv.config();

        const apiKey = process.env.OPENAI_API_KEY;
        const organization = process.env.OPENAI_ORG_ID;

        if (!apiKey) {
          throw new Error("The OPENAI_API_KEY environment variable is missing or empty.");
        }

        if (!organization) {
          throw new Error("The OPENAI_ORG_ID environment variable is missing or empty.");
        }

        const openai = new OpenAI({
          apiKey: apiKey,
          organization: organization,
        });

        let assistantId;
        let threadId;
        // Call processUserMessage to get the assistant's response
        const responseChunks = [];
        try {
          try {
            console.log("Initializing assistant and thread...");
            try {
              if (!assistantId) {
                console.log("Creating new assistant...");
                const assistant = await openai.beta.assistants.create({
                  name: "ChatBot",
                  instructions: "You are a helper for volunteer tutors at 'Hjemmeværnsskolen'.",
                  tools: [{ type: "file_search" }],
                  model: "gpt-4o-mini",
                });
                assistantId = assistant.id;
                console.log("Assistant created with ID:", assistantId);
              }
              if (!threadId) {
                console.log("Creating new thread...");
                const thread = await openai.beta.threads.create();
                threadId = thread.id;
                console.log("Thread created with ID:", threadId);
              }
            } catch (error) {
              console.error("Error initializing assistant and thread:", error);
              throw error;
            }

            console.log("Adding user message to thread...");
            // Add user message to thread
            await openai.beta.messages.create(threadId, { role: "user", content: question });

            console.log("Streaming assistant response...");
            // Stream assistant response
            const run = await openai.beta.threads.runs.stream(threadId, { assistant_id: assistantId })
              .on("textDelta", textDelta => {
                if (responseChunks.push(textDelta)) onTextDelta(textDelta.value); // Send chunk to server
              });

            return run;
          } catch (error) {
            console.error("Error processing user message:", error);
            throw new Error("Failed to process user message");
          }
        } catch (error) {
          console.error("Error processing user message:", error);
          response.writeHead(500, { "Content-Type": "application/json" });
          return response.end(JSON.stringify({ error: "Failed to process user message" }));
        }

        // End the response after all the chunks are sent
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({
          response: responseChunks.join(""), // Join all the text chunks to form the final response
        }));
      } catch (error) {
        console.error("Error handling assistant query:", error); // Log any errors
        response.writeHead(500, { "Content-Type": "application/json" }); // Respond with 500 if an error occurs
        response.end(JSON.stringify({ error: "Failed to process assistant query" }));
      }
    });
  }

  let filePath;
  let pathName = getPathName(request.url);

  // Default til "index.html"
  if (pathName === "") {
    pathName = "index.html";
  }

  // Samler filePath
  filePath = path.join(__dirname, pathName);

  // Få filtypen fra path-modulet
  const fileType = path.extname(filePath);

  // Check om filer eksisterer
  fs.readFile(filePath, "utf8", function (err, data) {
    if (err) {
      console.log("PROBLEMS: File not found", err);
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.write(`404`);
      response.end();
    } else {
      if (fileType) {
        response.writeHead(200, { "Content-Type": mime[fileType] });
      }
      response.write(data);
      response.end();
    }
  });
}

function getPathName(url) {
  let questionMark = url.indexOf("?");
  if (questionMark < 0) questionMark = url.length;
  let doubleSlash = url.indexOf("://");
  if (doubleSlash > -1) doubleSlash += 3;
  else doubleSlash = 0;
  let slash = url.indexOf("/", doubleSlash);
  return url.substring(slash + 1, questionMark);
}
