const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();
const fs = require("fs").promises;
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');
const { exec } = require("child_process");

// const gtts = require('node-gtts')('id');
const filepath = path.join(__dirname, 'i-love-you.wav');

const gTTS = require('gtts');

async function convertTextToSpeech({ text, fileName }) {
  try {
    const saveAudioDirs = path.join(projectRoot, 'storage', 'avatar', 'audios', `${fileName}.wav`);
    var gtts = new gTTS(text, 'id');

    // Simpan file audio sementara dalam format MP3
    const tempMp3Path = path.join(projectRoot, 'storage', 'avatar', 'audios', `${fileName}.mp3`);
    // Hapus file MP3 sementara jika sudah ada
    await fs.unlink(tempMp3Path).catch((error) => {
      if (error.code !== 'ENOENT') {
        console.error('Gagal menghapus file MP3 sementara:', error);
        throw error;
      }
    });

    await new Promise((resolve, reject) => {
      gtts.save(tempMp3Path, function (err, result) {
        if (err) { 
          console.error('Gagal menyimpan file MP3 sementara:', err);
          reject(err); 
        } else {
          console.log('File MP3 sementara berhasil disimpan:', result);
          resolve();
        }
      });
    });

    // Konversi MP3 ke WAV dengan LINEAR16 encoding menggunakan ffmpeg
    // Hapus file WAV jika sudah ada sebelum mengkonversi MP3 ke WAV
    await fs.unlink(saveAudioDirs).catch((error) => {
      if (error.code !== 'ENOENT') {
        console.error('Gagal menghapus file WAV yang akan jadi output:', error);
        throw error;
      }
    });

    // let ffmpegPath = 'ffmpeg'
    // // if (process.env.FFMPG_STATIC === 'true') {
    // //   ffmpegPath = path.join(projectRoot, 'bin', 'ffmpeg', 'ffmpeg');
    // // }

    const ffmpegCommand = `ffmpeg -i ${tempMp3Path} -acodec pcm_s16le -ar 44100 ${saveAudioDirs}`;

    // Konversi MP3 ke WAV dengan LINEAR16 encoding menggunakan ffmpeg
    await new Promise((resolve, reject) => {
      exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('Gagal mengkonversi MP3 ke WAV:', error);
          reject(error);
        } else {
          console.log('Konversi MP3 ke WAV berhasil:', stdout);
          resolve();
        }
      });
    });

    // Hapus file MP3 sementara
    await fs.unlink(tempMp3Path).then(() => {
      console.log('File MP3 sementara berhasil dihapus.');
    }).catch((error) => {
      console.error('Gagal menghapus file MP3 sementara:', error);
    });

    console.log('Success! Audio file converted to WAV with LINEAR16 encoding.');
    return {
      message: `Konten audio berhasil ditulis ke file: ${fileName}`,
      fileName: `${fileName}`
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