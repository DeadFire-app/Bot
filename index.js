const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const axios = require('axios');
const simpleGit = require('simple-git');

const client = new Client({
    authStrategy: new LocalAuth()
});

// --- QR para login ---
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot listo y conectado a WhatsApp');
});

// --- Respuestas básicas ---
client.on('message', async msg => {
    if (msg.body.toLowerCase() === '!ping') {
        msg.reply('🏓 Pong!');
    }

    if (msg.body.toLowerCase() === '!clima') {
        try {
            const apiKey = 'TU_API_KEY_OPENWEATHER'; // poné tu API key
            const ciudad = 'Zárate,AR';
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`;

            const { data } = await axios.get(url);
            const clima = `🌤️ En ${data.name} ahora hay ${data.weather[0].description}, 
            temperatura: ${data.main.temp}°C, humedad: ${data.main.humidity}%`;

            msg.reply(clima);
        } catch (err) {
            msg.reply('⚠️ No pude obtener el clima ahora mismo.');
        }
    }
});

// --- Servidor Express para Webhook de GitHub ---
const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
    // Cuando GitHub haga un push, este endpoint se dispara
    console.log('📥 Webhook recibido de GitHub');

    // Actualizar repo local
    const git = simpleGit();
    await git.pull();

    // Avisar por WhatsApp
    const numero = '5493487231547@c.us';
    client.sendMessage(numero, 'me actualicé');

    res.sendStatus(200);
});

app.listen(3000, () => {
    console.log('🌐 Servidor webhook escuchando en puerto 3000');
});

client.initialize();
