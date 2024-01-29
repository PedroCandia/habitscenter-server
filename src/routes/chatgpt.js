const { Router } = require('express');
const app = Router();
const OpenAI = require('openai');
const authSvc = require('../services/auth.js');
const auxFns = require('../services/auxFns.js');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const assistans = {
        'Salud Mental': 'asst_5bkJFTvr5adbPaMBTTYlwK4C',
        'Desarrollo personal': 'asst_6cQixAu9XPPjElHGHQ5iIIdT',
        'Alimentación': 'asst_MxtQbPChRBFs5cVGwUY9Jd7R',
        'Ejercicio': 'asst_MmfyeWQ0kfxWIw7hFpIQuwvc',
        'Sueño': 'asst_P00RbTXkPpldt8nF7FJVT8RN',
        'Relaciones sociales': 'asst_HBvn0eoKjKLvQ7Fvume7OWCY',
        'Gestión del tiempo': 'asst_NGrdYQdq0myhrZx5AP8W5zq6',
        'Gestión del estrés': 'asst_KBvOpcm5hbZ67zbAm7gKpGZo',
        // users: {
        //     id: {
        //         assistanThread: 'thread_QK4AdSHi7R5JU5T94kx56iDG'
        //     }
        // }
};

app.post('/chat', async (req, res) => {
    // [0] asst_5bkJFTvr5adbPaMBTTYlwK4C
    const requestData = req.body;
    const assistantID = assistans[requestData.specialty];

    const supabase = await authSvc.createClient();
    const { data, error } = await supabase.from('assistants').select('thread').eq('id', requestData.id).eq('bot', assistantID);

    let threadID;
    const threadExists = data.length >= 1;
    if(threadExists && data[0] && data[0]?.thread) {
        // Si existe el thread significa que el usuario ya interactuo con el bot
        threadID = data[0].thread;
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
    const thread_id = data[0].thread;

    const numberOfMessages = 15;
    let messages = await openai.beta.threads.messages.list(thread_id);
    messages = messages.body.data.slice(0, numberOfMessages);
    messages = messages.map(message => ({
        role: message.role,
        content: message.content
    }));
    console.log('Final messages: ', messages);

    res.status(200).json(messages);
});

module.exports = app;
