const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();
const fs = require("fs").promises;
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');

async function convertTextToSpeech({text, fileName}){
    try {
      const request = {
        input: { text: text },
        voice: { languageCode: 'id-ID', ssmlGender: 'FEMALE', name: 'id-ID-Wavenet-D' },
        audioConfig: { 
          audioEncoding: 'LINEAR16',
        },
      };
      const [response] = await client.synthesizeSpeech(request);
      console.log(fileName)
      
      const audioDir = path.join(projectRoot, 'public', 'storage', 'avatar', 'audios');
      await fs.writeFile(path.join(audioDir, fileName), response.audioContent, 'binary');
      return {
        message : `Konten audio berhasil ditulis ke file: ${fileName}`, 
        fileName : `${fileName}`
      }
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      if (error.code === 'ENOENT') {
        return {
          error: true,
          message: "Terjadi kesalahan: File konfigurasi Google Text-to-Speech tidak ditemukan. Pastikan file konfigurasi tersedia dan path-nya benar."
        };
      } else {
        return {
          error: true,
          message: "Terjadi kesalahan saat memproses permintaan: " + error.message
        };
      }
    }
}

module.exports = {
    convertTextToSpeech
}