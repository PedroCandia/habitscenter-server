const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

const ChatGPT = require('./routes/chatgpt');
const supabase = require('./routes/supabase');

// settings
app.set('appName', 'HabitsCenter AI');
app.set('port', 3000);
app.set('case sensitive routing', true);

// middlewares
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// routes
app.get('/', (req, res) => {
    res.send('Hello world');
});

app.use('/gpt', ChatGPT);
app.use('/auth', supabase);

app.use((req, res) => {
    res.send('No se encontro una ruta');
})

app.listen(app.get('port'));
console.log(`Server ${app.get('appName')} on port: ${app.get('port')}`);