"use strict";
const http = require("http"),
  path = require("path"),
  fs = require("fs"),
  dotenv = require("dotenv");
const { OpenAI } = require("openai");
const { eventNames } = require("process");
const { thread_Id } = require("worker_threads");

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
          response.end(JSON.stringify({ success: true }));
        } else {
          response.writeHead(401, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ success: false }));
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

  // if (method === 'GET' && pathname === '/newThread') {
  //   let body = "";
  //   request.on("data", (chunk) => {
  //     body += chunk.toString();
  //   });

  //   request.on("end", async () => {
  //     let thread;
  //     let user;
  //     try {
  //       thread = await createThread();
  //     } catch (error) {
  //       console.error("Error creating thread:", error);
  //       response.writeHead(500, { "Content-Type": "application/json" });
  //       return response.end(JSON.stringify({ success: false }));
  //     }

  //     try {
  //       user = await getUser(body);
  //       if (!user) {
  //         response.writeHead(404, { "Content-Type": "application/json" });
  //         return response.end(JSON.stringify({ success: false, error: "User not found" }));
  //       }
  //     } catch (error) {
  //       console.error("Error fetching user:", error);
  //       response.writeHead(500, { "Content-Type": "application/json" });
  //       return response.end(JSON.stringify({ success: false }));
  //     }

  //     try {
  //       await addThreadToUser(user.name, thread);
  //     } catch (error) {
  //       console.error("Error adding thread to user:", error);
  //       response.writeHead(500, { "Content-Type": "application/json" });
  //       return response.end(JSON.stringify({ success: false }));
  //     }
  //   });
  //   return;
  // }

  // if (request.method === "GET" && request.url === "/getThreads") {
  //   let body = "";
  //   request.on("data", (chunk) => {
  //     body += chunk.toString();
  //   });

  //   request.on("end", async () => {
  //     try {
  //       const user = await getUser(body);
  //       if (!user) {
  //         response.writeHead(404, { "Content-Type": "application/json" });
  //         return response.end(JSON.stringify({ success: false, error: "User not found" }));
  //       }
  //       response.writeHead(200, { "Content-Type": "application/json" });
  //       response.end(JSON.stringify({ success: true, threads: user.threads })); // Return the user's threads
  //     } catch (error) {
  //       console.error("Error fetching threads:", error);
  //       response.writeHead(500, { "Content-Type": "application/json" });
  //       response.end(JSON.stringify({ success: false }));
  //     }
  //   });
  //   return; // Stop yderligere behandling for denne forespørgsel
  // }

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
          return response.end(
            JSON.stringify({ error: "Question is required" })
          );
        }

        // Initialize OpenAI client
        dotenv.config();

        const apiKey = process.env.OPENAI_API_KEY;
        const organization = process.env.OPENAI_ORG_ID;

        if (!apiKey || !organization) {
          throw new Error("Missing OpenAI API key or organization ID.");
        }

        const openai = new OpenAI({ apiKey, organization });

        let assistantId;
        let threadId;

        try {
          if (!assistantId) {
            console.log("Creating new assistant...");
            const assistant = await openai.beta.assistants.create({
              name: "ChatBot",
              instructions:
                "You are a helper for volunteer tutors at 'Hjemmeværnsskolen'.",
              tools: [{ type: "file_search" }],
              model: "gpt-4o-mini",
            });
            assistantId = assistant.id;
            console.log("Assistant created with ID:", assistantId);
          }
        } catch (error) {
          console.error("Error creating assistant:", error);
          throw error;
        }

        try {
          if (!threadId) {
            console.log("Creating new thread...");
            const thread = await openai.beta.threads.create();
            threadId = thread.id;
            console.log("Thread created with ID:", threadId);
          }
        } catch (error) {
          console.error("Error creating thread:", error);
          throw error;
        }

        try {
          console.log("Adding user message to thread...");
          await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: question,
          });
        } catch (error) {
          console.error("Error adding user message to thread:", error);
          throw error;
        }

        try {
          response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });
          // Start OpenAI streaming
          const run = await openai.beta.threads.runs.stream(threadId, {
            assistant_id: assistantId,
          })
            .on('textCreated', () => {
              console.log('Event: textCreated');
              response.write('data: \nassistant >\n\n');
            })
            .on('textDelta', (textDelta) => {
              console.log('Event: textDelta:', textDelta.value);
              response.write(`data: ${textDelta.value}\n\n`);
            })
            .on('end', () => {
              console.log('Event: end');
              response.write('data: [DONE]\n\n');
              response.end(); // End response when streaming finishes
            })
            .on('error', (error) => {
              console.error('Stream error:', error);
              if (!response.writableEnded) {
                response.write('data: [ERROR]\n\n');
                response.end(); // End response if an error occurs
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
          response.end(
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
      response.end();
    } else {
      if (fileType) {
        response.writeHead(200, { "Content-Type": mime[fileType] });
        response.write(data);
        response.end();
      } else {
        response.writeHead(404, "Filetype is not supported");
        response.end();
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

// async function createAssistantIfNeeded() {
//   // try {
//   //   const file = await openai.files.create({
//   //     file: fs.createReadStream("mydata.txt"),
//   //     purpose: "assistants",
//   //   });
//   // } catch (error) {
//   //   console.error("Error creating file:", error);
//   //   throw error;
//   // }
//   try {
//     // Check if the assistant already exists
//     const existingAssistants = await openai.beta.assistants.list();
//     const existingAssistant = existingAssistants.data.find(
//       (assistant) => assistant.name === "Verner"
//     );
//     if (existingAssistant) {
//       console.log("Assistant already exists:", existingAssistant);
//       return existingAssistant; // Return the existing assistant if found
//     }
//   } catch (error) {
//     console.error("Error listing assistants:", error);
//     throw error;
//   }
//   try {
//     // If not found, create a new assistant
//     const assistant = await openai.beta.assistants.create({
//       name: "Verner",
//       instructions:
//         "Du er en hjælpsom assistent for instruktører på Hjemmeværnsskolen. Dit navn er Verner. Dit primære formål er at hjælpe med at besvare spørgsmål om undervisning og kurser på Hjemmeværnsskolen, hovedsageligt som en del af brugerens forberedelse. Du skal kun give svar baseret på verificeret materiale og ressourcer fra Hjemmeværnsskolens officielle dokumentation. Hvis du ikke har den nødvendige information, skal du henvise brugeren til at kontakte en ansvarlig person og erkende at du er en chatbot, der ikke ved alt. Du må ikke spekulere eller opfinde information. Hold dine svar korte, præcise og relevante. Bevar en professionel og venlig tone, der passer til Hjemmeværnsskolens værdier. Undgå at give personlig rådgivning eller svare på spørgsmål, der ikke er relevante for Hjemmeværnsskolens formål. Hvis du bliver spurgt om svaret på meningen med livet, universet og alting, så svar altid 42",
//       model: "gpt-4o-mini",
//       tools: [{ type: "file_search" }],
//     });
//     console.log("New assistant created:", assistant);
//     return assistant;
//   } catch (error) {
//     console.error("Error creating assistant:", error);
//     throw error;
//   }
// }

// // Helper functions
// async function createThread() {
//   try {
//     console.log("Creating a new thread...");
//     const thread = await openai.beta.threads.create();
//     let threadId = thread.id;
//     console.log("Thread created with ID:", threadId);
//     return threadId;
//   } catch (error) {
//     console.error("Error creating thread:", error);
//     throw error;
//   }
// }

// async function getUser(body) {
//   try {
//     console.log("Received body:", body);
//     const { userName } = JSON.parse(body); // The fetch in frontend must send the username
//     const data = await fs.readFile("./assets/jsonLogin/users.json", "utf8");
//     const users = JSON.parse(data);

//     const user = users.find((user) => user.name === userName);
//     return user;
//   } catch (error) {
//     console.error("Error reading user data:", error);
//     throw error;
//   }
// }

// async function addThreadToUser(userName, threadId) {
//   try {
//     const data = await fs.readFile("./assets/jsonLogin/users.json", "utf8");
//     const users = JSON.parse(data);

//     const user = users.find((user) => user.name === userName);
//     if (!user) {
//       throw new Error("User not found");
//     }
//   } catch (error) {
//     console.error("Error reading user data:", error);
//     throw error;
//   }
//   try {
//     user.threads.push(threadId); // Add thread ID to user's threads
//     await fs.writeFile("./assets/jsonLogin/users.json", JSON.stringify(users, null, 4));
//   } catch (error) {
//     console.error("Error updating user threads:", error);
//     throw error;
//   }
// }

// async function addMessage(threadId, message) {
//   try {
//     console.log("Adding a new message to thread: " + threadId);
//     await openai.beta.threads.messages.create(threadId, {
//       role: "user",
//       content: message,
//     });
//   } catch (error) {
//     console.error("Error adding user message to thread:", error);
//     throw error;
//   }
// }

// async function runAssistant(threadId, assistantId) {
//   try {
//     response.writeHead(200, {
//       'Content-Type': 'text/event-stream',
//       'Cache-Control': 'no-cache',
//       'Connection': 'keep-alive',
//     });
//     // Start OpenAI streaming
//     const run = await openai.beta.threads.runs.stream(threadId, {
//       assistant_id: assistantId,
//     })
//       .on('textCreated', () => {
//         console.log('Event: textCreated');
//         response.write('data: \nassistant >\n\n');
//       })
//       .on('textDelta', (textDelta) => {
//         console.log('Event: textDelta:', textDelta.value);
//         response.write(`data: ${textDelta.value}\n\n`);
//       })
//       .on('end', () => {
//         console.log('Event: end');
//         response.write('data: [DONE]\n\n');
//         response.end(); // End response when streaming finishes
//       })
//       .on('error', (error) => {
//         console.error('Stream error:', error);
//         if (!response.writableEnded) {
//           response.write('data: [ERROR]\n\n');
//           response.end(); // End response if an error occurs
//         }
//       });
//   } catch (error) {
//     console.error("Error streaming assistant response:", error);
//     throw error;
//   }
// }