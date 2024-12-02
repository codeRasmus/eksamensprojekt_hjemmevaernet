"use strict";

const http = require("http"),
  path = require("path"),
  fs = require("fs"),
  dotenv = require("dotenv");
const { processUserMessage } = require("./modules/APIHandler");

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

// Create server
const server = http.createServer();
server.on("request", callback);

// Start server
server.listen(port, hostname, function () {
  console.log(`Server running at http://${hostname}:${port}/`);
});

// Validate login
function validateLogin(name, password) {
  const users = JSON.parse(fs.readFileSync("./assets/jsonLogin/users.json", "utf8"));
  return users.some(user => user.name === name && user.password === password);
}

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

  if (request.method === "POST" && request.url === "/ask-assistant") {
    await handleAssistantQuery(request, response);
    return;
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

// Handle assistant query endpoint
async function handleAssistantQuery(request, response) {
  let body = "";
  request.on("data", (chunk) => (body += chunk.toString())); // Collect data chunks from the request

  request.on("end", async () => {
    try {
      const { question } = JSON.parse(body); // Parse the JSON body to extract the question
      if (!question) {
        response.writeHead(400, { "Content-Type": "application/json" }); // Respond with 400 if question is missing
        return response.end(JSON.stringify({ error: "Question is required" }));
      }

      // Call processUserMessage to get the assistant's response
      const responseChunks = [];
      await processUserMessage(question, (textDelta) => {
        responseChunks.push(textDelta); // Collect response text as it streams in
        response.write(textDelta); // Write each chunk of the response to the client as it comes in
      });

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