const { Router } = require('express');
const app = Router();
const authSvc = require('../services/auth.js');

app.post('/createAccount', async (req, res) => {
    const { id } = req.body;
    const supabase = await authSvc.createClient();

    const { data, error } = await supabase.from('users').insert({
        id: id,
        rubys: 3
    });

    res.status(200).json(data);
});

app.post('/addRuby', async (req, res) => {
    const { id } = req.body;
    const supabase = await authSvc.createClient();

    const { data, error } = await supabase.from('users').select('rubys').eq('id', id);
    let newRubys;
    if(data && data[0]) {
        const currentRubys = data[0]?.rubys;
        newRubys = currentRubys + 1;

        await supabase.from('users').update({ rubys: newRubys }).eq('id', id);
    }

    res.status(200).json(newRubys);
});

app.post('/removeRuby', async (req, res) => {
    const { id } = req.body;
    const supabase = await authSvc.createClient();

    const { data, error } = await supabase.from('users').select('rubys').eq('id', id);
    let newRubys;
    if(data && data[0]) {
        const currentRubys = data[0]?.rubys;

        if(currentRubys < 1) {
            res.status(200).json(currentRubys);
            return;
        }
        newRubys = currentRubys - 1;

        await supabase.from('users').update({ rubys: newRubys }).eq('id', id);
    }

    res.status(200).json(newRubys);
});

module.exports = app;