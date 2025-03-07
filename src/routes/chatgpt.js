const { Router } = require('express');
const app = Router();
const OpenAI = require('openai');
const authSvc = require('../services/auth.js');
const auxFns = require('../services/auxFns.js');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {"OpenAI-Beta": "assistants=v2"}
});

const apiKey = process.env.OPENAI_API_KEY;

const assistans = {
    'Salud Mental': 'asst_5bkJFTvr5adbPaMBTTYlwK4C',
    'Neo': 'asst_dImrOqcDv0welHSgnmW1Gjrv',
    'Entrenador': 'asst_Y5sJ08pEWKWyrb4ymCitjAIG'
};

app.post('/chat', async (req, res) => {
    // [0] asst_5bkJFTvr5adbPaMBTTYlwK4C
    const requestData = req.body;
    const assistantID = assistans[requestData.specialty];

    const supabase = await authSvc.createClient();
    const { data, error } = await supabase.from('assistants').select('thread').eq('id', requestData.id).eq('bot', assistantID);

    let threadID;
    const threadExists = (data) && (data?.length >= 1 && data[0] && data[0]?.thread);
    if(threadExists) {
        // Si existe el thread significa que el usuario ya interactuo con el bot
        threadID = data[0]?.thread;
    } else {
        // Si no existe el thread significa que es su primer mensaje del usuario con este bot
        const thread = await openai.beta.threads.create();
        const { data, error } = await supabase.from('assistants').insert({
            id: requestData.id,
            bot: assistantID,
            thread: thread.id
        });        
        threadID = thread.id;
    }

    //Step 3: Add a Message to a Thread
    const message = await openai.beta.threads.messages.create(
        threadID,
        {
            role: "user",
            content: requestData.message
        }
    );

    const run = await openai.beta.threads.runs.create(
        threadID,
        { 
            assistant_id: assistantID,
        //   instructions: "Please address the user as Jane Doe. The user has a premium account."
        }
    );

    if(run.status === 'queued') {
        await waitForRunCompletion(threadID, run);
    }

    const messages = await openai.beta.threads.messages.list(threadID);
    // console.log('Final Message: ', messages.data[0]?.content);
    const finalMsg = messages.data[0]?.content[0]?.text?.value;

    res.status(200).json(finalMsg);
});

async function waitForRunCompletion(threadId, runData) {
    const pollingInterval = 3000; // Intervalo de 30 segundos (ajusta según tus necesidades)
    let runStatus = runData.status;
  
    while (runStatus !== 'completed') {
        const run = await openai.beta.threads.runs.retrieve(threadId, runData.id);
        runStatus = run.status;
    
        if (runStatus === 'completed') {
            console.log('El Run ha sido completado.');
            return true;
        } else {
            console.log(`Estado del Run: ${runStatus}. Esperando ${pollingInterval / 1000} segundos antes de la siguiente verificación.`);
            await auxFns.sleep(pollingInterval);
        }
    }
}

app.post('/getAllMessages', async (req, res) => {
    const { id, specialty } = req.body;
    const assistantId = assistans[specialty];
    
    const supabase = await authSvc.createClient();
    const { data, error } = await supabase.from('assistants').select('thread').eq('id', id).eq('bot', assistantId);
    let messages = [];
    if(!data || data?.length < 1) {
        res.status(200).json(messages);
        return;
    }
    const thread_id = data[0]?.thread;

    const numberOfMessages = 15;
    try {
        messages = await openai.beta.threads.messages.list(thread_id);   
    } catch (error) {
        res.status(200).json(messages);
        console.log('Error openai list: ', error);
        return;
    }
    messages = messages.body.data.slice(0, numberOfMessages);
    messages = messages.map(message => ({
        role: message.role,
        content: message.content
    }));
    console.log('Final messages: ', messages);

    res.status(200).json(messages);
});

app.get('/realtime-token', async (req, res) => {
    try {
        const response = await fetch(
          "https://api.openai.com/v1/realtime/sessions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-realtime-preview-2024-12-17",
              voice: "verse",
            }),
          },
        );
    
        const data = await response.json();
        res.json(data);
      } catch (error) {
        console.error("Token generation error:", error);
        res.status(500).json({ error: "Failed to generate token" });
      }
});

app.post('/realtime-msg', async (req, res) => {
    try {
        const { offer, EPHEMERAL_KEY } = req.body;
        const baseUrl = "https://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2024-12-17";

        const response = await fetch(
            `${baseUrl}?model=${model}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${EPHEMERAL_KEY}`,
              "Content-Type": "application/sdp",
            },
            body: offer.sdp,
          },
        );
        
        const data = await response.text();
        res.send(data);
      } catch (error) {
        console.error("Token generation error:", error);
        res.status(500).json({ error: "Failed to generate token" });
      }
});

const speech = require('@google-cloud/speech');
process.env.GOOGLE_APPLICATION_CREDENTIALS='speechtotextgoogle.json';

// indispensable para convertir acc a web
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

app.post('/voice-recorder-to-text', async (req, res) => {
    try {
        const client = new speech.SpeechClient();
        const { audio, mimeType } = req.body; // Audio en Base64

        console.log("Formato recibido:", mimeType);

        let finalAudio = audio;
        let finalMimeType = mimeType;

        // 🟢 Si el audio es AAC, lo convertimos a WebM Opus
        if (mimeType === 'audio/aac') {
            console.log("Convirtiendo AAC a WebM Opus...");
            finalAudio = await convertAACtoWebM(audio);
            finalMimeType = 'audio/webm;codecs=opus'; // Ahora es WebM Opus
        }

        // 🔹 Enviar a Google Speech-to-Text
        const request = {
            audio: { content: finalAudio },
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'es-ES',
            },
        };

        const [response] = await client.recognize(request);
        console.log('resp client recognize: ', response);

        const transcription = response.results.map(r => r.alternatives[0].transcript).join('\n');
        
        console.log('transcription: ', transcription);
        
        res.json({ transcription });   
    } catch (error) {
        console.error('Error en reconocimiento de voz:', error);
        return res.status(500).json({ error: 'Error procesando el audio' });
    }
});

// 🛠 Función para convertir AAC a WebM Opus con FFmpeg
async function convertAACtoWebM(base64Audio) {
    return new Promise((resolve, reject) => {
        const inputPath = path.join(__dirname, 'temp', 'input.aac');
        const outputPath = path.join(__dirname, 'temp', 'output.webm');

        // Guarda el Base64 en un archivo temporal
        fs.writeFileSync(inputPath, Buffer.from(base64Audio, 'base64'));

        ffmpeg(inputPath)
            .toFormat('webm')
            .audioCodec('libopus')
            .on('end', () => {
                console.log("Conversión completada.");
                const outputAudio = fs.readFileSync(outputPath).toString('base64');
                fs.unlinkSync(inputPath); // Borra archivos temporales
                fs.unlinkSync(outputPath);
                resolve(outputAudio);
            })
            .on('error', (err) => {
                console.error("Error en conversión FFmpeg:", err);
                reject(err);
            })
            .save(outputPath);
    });
}

module.exports = app;
