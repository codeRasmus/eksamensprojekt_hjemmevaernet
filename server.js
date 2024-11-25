"use strict";
const http = require("http"),
  path = require("path"),
  port = 3000,
  hostname = "127.0.0.1";
const server = http.createServer();
server.on("request", callback);

const fs = require("fs");

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
function callback(request, response) {
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
