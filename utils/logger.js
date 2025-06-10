const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function logError(error) {
  const logFile = path.join(logDir, "error.log");
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${error.stack || error}\n\n`;
  fs.appendFile(logFile, message, (err) => {
    if (err) console.error("Erro ao gravar log:", err);
  });
}

module.exports = { logError };
