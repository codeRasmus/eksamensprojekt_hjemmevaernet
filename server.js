"use strict";
const http = require("http"),
  path = require("path"),
  fs = require("fs"),
  dotenv = require("dotenv");
const { OpenAI } = require("openai");

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
  const users = JSON.parse(
    fs.readFileSync("./assets/jsonLogin/users.json", "utf8")
  );
  return users.some((user) => user.name === name && user.password === password);
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
          return response.end(JSON.stringify({ success: true }));
        } else {
          response.writeHead(401, { "Content-Type": "application/json" });
          return response.end(JSON.stringify({ success: false }));
        }
      } catch (error) {
        console.error("Fejl ved behandling af login:", error);
        response.writeHead(400, { "Content-Type": "application/json" });
        return response.end(
          JSON.stringify({ success: false, error: "Invalid JSON input" })
        );
      }
    });

    return; // Stop yderligere behandling for denne forespørgsel
  }

  if (request.method === "POST" && request.url === "/getThreads") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    request.on("end", async () => {
      try {
        const { userName } = JSON.parse(body); // The fetch in frontend must send the username
        const user = await getUser(userName);
        if (!user) {
          response.writeHead(404, { "Content-Type": "application/json" });
          return response.end(JSON.stringify({ success: false, error: "User not found" }));
        }
        response.writeHead(200, { "Content-Type": "application/json" });
        return response.end(JSON.stringify({ success: true, threads: user.threads })); // Return the user"s threads
      } catch (error) {
        console.error("Error fetching threads:", error);
        response.writeHead(500, { "Content-Type": "application/json" });
        return response.end(JSON.stringify({ success: false }));
      }
    });
    return; // Stop yderligere behandling for denne forespørgsel
  }

  // if (request.method === "POST" && request.url === "/getThreadMessages") {
  //   let body = "";
  //   request.on("data", (chunk) => {
  //     body += chunk.toString();
  //   });

  //   request.on("end", async () => {
  //     try {
  //       const { threadId } = JSON.parse(body);
  //       const messages = await getMessages(threadId);
  //       threadId = threadId;
  //       response.writeHead(200, { "Content-Type": "application/json" });
  //       return response.end(JSON.stringify({ messages }));
  //     } catch (error) {
  //       console.error("Error fetching messages:", error);
  //       response.writeHead(500, { "Content-Type": "application/json" });
  //       return response.end(JSON.stringify({ error: "Failed to fetch messages" }));
  //     }
  //   });
  //   return;
  // }

  // Handle assistant query endpoint
  if (request.method === "POST" && request.url === "/ask-assistant") {
    console.log("Received assistant query");
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    request.on("end", async () => {
      try {
        console.log("Received body:", body); // Log the received body
        const { question, currentThread, userName } = JSON.parse(body); // Parse the JSON body to extract the question
        if (!question) {
          response.writeHead(400, { "Content-Type": "application/json" }); // Respond with 400 if question is missing
          return response.end(JSON.stringify({ error: "Question is required" }));
        }

        let assistantId;
        let threadId = currentThread;

        try {
          // Initialize the assistant
          const assistant = await createAssistantIfNeeded();
          if (!assistant) {
            console.error("Failed to create or retrieve assistant.");
            response.writeHead(500, { "Content-Type": "application/json" }); // Respond with 500 if assistant creation fails
            return response.end(JSON.stringify({ error: "Failed to create or retrieve assistant" }));
          }
          assistantId = assistant.id;
        } catch (error) {
          console.error("Error creating assistant:", error);
          throw error;
        }

        if (currentThread === "") {
          let thread;
          let user;
          try {
            thread = await createThread();
          } catch (error) {
            console.error("Error creating thread:", error);
            response.writeHead(500, { "Content-Type": "application/json" });
            return response.end(JSON.stringify({ success: false }));
          }

          try {
            user = await getUser(userName);
            if (!user) {
              response.writeHead(404, { "Content-Type": "application/json" });
              return response.end(JSON.stringify({ success: false, error: "User not found" }));
            }
          } catch (error) {
            console.error("Error fetching user:", error);
            response.writeHead(500, { "Content-Type": "application/json" });
            return response.end(JSON.stringify({ success: false }));
          }

          try {
            await addThreadToUser(user.name, thread);
            threadId = thread;
          } catch (error) {
            console.error("Error adding thread to user:", error);
            response.writeHead(500, { "Content-Type": "application/json" });
            return response.end(JSON.stringify({ success: false }));
          }
        }

        try {
          console.log("Adding user message to thread...");
          addMessage(threadId, question)
        } catch (error) {
          console.error("Error adding user message to thread:", error);
          throw error;
        }

        console.log("Running assistant for thread...");
        // Initialize OpenAI client
        dotenv.config();
        const apiKey = process.env.OPENAI_API_KEY;
        const organization = process.env.OPENAI_ORG_ID;
        if (!apiKey || !organization) {
          throw new Error("Missing OpenAI API key or organization ID.");
        }
        const openai = new OpenAI({ apiKey, organization });
        try {
          response.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          });
          // Start OpenAI streaming
          const run = await openai.beta.threads.runs.stream(threadId, {
            assistant_id: assistantId,
          })
            .on("textCreated", () => {
              console.log("Event: textCreated");
              response.write("data: \nassistant >\n\n");
            })
            .on("textDelta", (textDelta) => {
              console.log("Event: textDelta:", textDelta.value);
              response.write(`data: ${textDelta.value}\n\n`);
            })
            .on("end", () => {
              console.log("Event: end");
              response.write("data: [DONE]\n\n");
              return response.end(); // End response when streaming finishes
            })
            .on("error", (error) => {
              console.error("Stream error:", error);
              if (!response.writableEnded) {
                response.write("data: [ERROR]\n\n");
                return response.end(); // End response if an error occurs
              }
            });
        } catch (error) {
          console.error("Error streaming assistant response:", error);
          throw error;
        }
      } catch (error) {
        console.error("Error handling assistant query:", error); // Log any errors
        if (!response.headersSent) {
          response.writeHead(500, { "Content-Type": "application/json" }); // Respond with 500 if an error occurs
          return response.end(
            JSON.stringify({ error: "Failed to process assistant query" })
          );
        }
      }
    });
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
      return response.end();
    } else {
      if (fileType) {
        response.writeHead(200, { "Content-Type": mime[fileType] });
        response.write(data);
        return response.end();
      } else {
        response.writeHead(404, "Filetype is not supported");
        return response.end();
      }
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

async function createAssistantIfNeeded() {
  // Initialize OpenAI client
  dotenv.config();
  const apiKey = process.env.OPENAI_API_KEY;
  const organization = process.env.OPENAI_ORG_ID;
  if (!apiKey || !organization) {
    throw new Error("Missing OpenAI API key or organization ID.");
  }
  const openai = new OpenAI({ apiKey, organization });

  // try {
  //   // Check if the assistant already exists
  //   const existingAssistants = await openai.beta.assistants.list();
  //   const existingAssistant = existingAssistants.data.find(
  //     (assistant) => assistant.name === "Verner"
  //   );
  //   if (existingAssistant) {
  //     console.log("Assistant already exists:", existingAssistant);
  //     return existingAssistant; // Return the existing assistant if found
  //   }
  // } catch (error) {
  //   console.error("Error listing assistants:", error);
  //   throw error;
  // }
  let _vectorStoreId;
  try {
    const fileStreams = ["fih.txt"].map((path) => // Add the paths to the files
      fs.createReadStream(path),
    );

    // Create a vector store including our two files.
    let vectorStore = await openai.beta.vectorStores.create({
      name: "Hjemmeværnsskolens dokumentation",
    });

    await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, { files: fileStreams, });
    _vectorStoreId = vectorStore.id;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
  try {
    // If not found, create a new assistant
    const assistant = await openai.beta.assistants.create({
      name: "Verner",
      instructions:
        "Du er en hjælpsom assistent for instruktører på Hjemmeværnsskolen. Dit navn er Verner. Dit primære formål er at hjælpe med at besvare spørgsmål om undervisning og kurser på Hjemmeværnsskolen, hovedsageligt som en del af brugerens forberedelse. Du skal kun give svar baseret på verificeret materiale og ressourcer fra Hjemmeværnsskolens officielle dokumentation. Hvis du ikke har den nødvendige information, skal du henvise brugeren til at kontakte en ansvarlig person og erkende at du er en chatbot, der ikke ved alt. Du må ikke spekulere eller opfinde information. Hold dine svar korte, præcise og relevante. Bevar en professionel og venlig tone, der passer til Hjemmeværnsskolens værdier. Undgå at give personlig rådgivning eller svare på spørgsmål, der ikke er relevante for Hjemmeværnsskolens formål. Hvis du bliver spurgt om svaret på meningen med livet, universet og alting, så svar altid 42",
      model: "gpt-4o-mini",
      tools: [{ type: "file_search" }],
      tool_resources: {
        "file_search": {
          "vector_store_ids": [_vectorStoreId],
        }
      }
    });
    console.log("New assistant created:", assistant);
    console.log("Vector store ID:", _vectorStoreId);
    return assistant;
  } catch (error) {
    console.error("Error creating assistant:", error);
    throw error;
  }
}

// Helper functions
async function createThread() {
  // Initialize OpenAI client
  dotenv.config();
  const apiKey = process.env.OPENAI_API_KEY;
  const organization = process.env.OPENAI_ORG_ID;
  if (!apiKey || !organization) {
    throw new Error("Missing OpenAI API key or organization ID.");
  }
  const openai = new OpenAI({ apiKey, organization });
  try {
    console.log("Creating a new thread...");
    const thread = await openai.beta.threads.create();
    let threadId = thread.id;
    console.log("Thread created with ID:", threadId);
    return threadId;
  } catch (error) {
    console.error("Error creating thread:", error);
    throw error;
  }
}

async function getUser(userName) {
  // Initialize OpenAI client
  dotenv.config();
  const apiKey = process.env.OPENAI_API_KEY;
  const organization = process.env.OPENAI_ORG_ID;
  if (!apiKey || !organization) {
    throw new Error("Missing OpenAI API key or organization ID.");
  }
  const openai = new OpenAI({ apiKey, organization });
  try {
    const data = await fs.readFileSync("./assets/jsonLogin/users.json", "utf8");
    const users = JSON.parse(data);

    const user = users.find((user) => user.name === userName);
    return user;
  } catch (error) {
    console.error("Error reading user data:", error);
    throw error;
  }
}

async function addThreadToUser(userName, threadId) {
  // Initialize OpenAI client
  dotenv.config();
  const apiKey = process.env.OPENAI_API_KEY;
  const organization = process.env.OPENAI_ORG_ID;
  if (!apiKey || !organization) {
    throw new Error("Missing OpenAI API key or organization ID.");
  }
  const openai = new OpenAI({ apiKey, organization });
  let user;
  let users;
  try {
    const data = await fs.readFileSync("./assets/jsonLogin/users.json", "utf8");
    users = JSON.parse(data);

    user = users.find((user) => user.name === userName);
    if (!user) {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error reading user data:", error);
    throw error;
  }
  try {
    user.threads.push(threadId); // Add thread ID to user"s threads
    await fs.writeFileSync("./assets/jsonLogin/users.json", JSON.stringify(users, null, 4));
  } catch (error) {
    console.error("Error updating user threads:", error);
    throw error;
  }
}

async function addMessage(threadId, message) {
  // Initialize OpenAI client
  dotenv.config();
  const apiKey = process.env.OPENAI_API_KEY;
  const organization = process.env.OPENAI_ORG_ID;
  if (!apiKey || !organization) {
    throw new Error("Missing OpenAI API key or organization ID.");
  }
  const openai = new OpenAI({ apiKey, organization });
  try {
    console.log("Adding a new message to thread: " + threadId);
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });
  } catch (error) {
    console.error("Error adding user message to thread:", error);
    throw error;
  }
}