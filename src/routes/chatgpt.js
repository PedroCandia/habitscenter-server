const { Router } = require('express');
const app = Router();
const OpenAI = require('openai');

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
    const data = req.body;
    /*
    
        data = {
            userID: ''
            message: '',
            assistantID: 0,
        }

    */
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: 'system',
                content: 'Tu eres un buen asistente de ' + data.specialty + '.'
            },
            {
                role: 'user',
                content: data.message
            }
        ],
        temperature: 0,
        max_tokens: 256,
    });

        
    //! 1. LLamar a la base de datos para ver si el usuario ya thread con el bot
    //     En caso de que no, se ocupa crear uno

    //! 2. Crear un mensaje en el thread con el data.msg
    // Ya tendriamos el botID, el theadID

    //! 3. Hacer el run (recordar que este se queda en status queue)
    // runID

    //! Verficar cada cierto tiempo hasta que el runID status sea completed

    //! Obtener los nuevos mensajes y enviarlos al frontend

    // Se ocupa crear threads 8 por usuario (1 para cada bot)
    // const thread = await openai.beta.threads.create();

    // const message = await openai.beta.threads.messages.create(
    //     thread.id,
    //     {
    //       role: "user",
    //       content: data.message
    //     }
    // );

    // const run = await openai.beta.threads.runs.create(
    //     thread.id,
    //     { 
    //       assistant_id: assistans[data.assistantID],
        //   instructions: "Please address the user as Jane Doe. The user has a premium account."
    //     }
    // );
    
    // const messages = await openai.beta.threads.messages.list(
    //     thread.id
    // );

    // messages.body.data.forEach
    
    // const response = await openai.chat.completions.create({
    //     model: "gpt-3.5-turbo",
    //     messages: [
    //         {
    //             role: 'system',
    //             content: 'Tu eres un buen asistente de ' + data.specialty + '.'
    //         },
    //         {
    //             role: 'user',
    //             content: data.message
    //         }
    //     ],
    //     temperature: 0,
    //     max_tokens: 256,
    // });

    res.status(200).json(response);
    // res.status(200).json(messages);
});

module.exports = app;

/*

    En caso de que un usuario quiera agregar su propio asistente (PREMIUM)

    const assistant = await openai.beta.assistants.create({
    name: "Math Tutor",
    instructions: "You are a personal math tutor. Write and run code to answer math questions.",
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4-1106-preview"
    });

    fetch an existin assistant

    const assistant = await openai.beta.assistants.retrieve(
        'asst_5bkJFTvr5adbPaMBTTYlwK4C'
    );

    Crear un hilo
    const thread = await openai.beta.threads.create();

    Crear un msg
    const message = await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: data.message
        }
    );

    run assistants //! Importante que la respuesta de run puede estar en status queue
     const run = await openai.beta.threads.runs.create(
        thread.id,
        { 
          assistant_id: assistans[data.assistantID],
          instructions: "Please address the user as Jane Doe. The user has a premium account."
        }
    );

    a //! para verificar el status es con
    const run = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
    );

    a //! una vez que el status es completed con el pasado run
    a //! obtenemos los mensajes
    const messages = await openai.beta.threads.messages.list(
        thread.id
    );
*/
