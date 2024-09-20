const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');


const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  const rhubarbPath = path.join(projectRoot, 'bin', 'rhubarb', 'rhubarb.exe');
  const outputPath = path.join(projectRoot, 'storage', 'avatar', 'audios', `${message}.json`);
  const inputPath = path.join(projectRoot, 'storage', 'avatar', 'audios', `${message}.wav`);
  await execCommand(`${rhubarbPath} -f json -o ${outputPath} ${inputPath} -r phonetic`);
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};

const readJsonTranscript = async (file) => {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
};
  
const audioFileToBase64 = async (file) => {
    const data = await fs.readFile(file);
    return data.toString("base64");
};

module.exports = { lipSyncMessage, readJsonTranscript, audioFileToBase64 }