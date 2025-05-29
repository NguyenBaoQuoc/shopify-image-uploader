const fs = require('fs');
async function logResult(message) {
    fs.appendFileSync('log.txt', `${new Date().toISOString()} - ${message}\n`);
}

async function clearLog() {
    try {
        fs.writeFileSync('log.txt', '');
    } catch (error) {
        console.error('Error clearing log file:', error);
    }
}

module.exports = { logResult, clearLog };