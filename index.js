const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const axios = require('axios');
const simpleGit = require('simple-git');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    // --- Mensajes entrantes ---
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const texto = msg.message.conversation || '';
        const jid = msg.key.remoteJid;

        if (texto.toLowerCase() === '!ping') {
            await sock.sendMessage(jid, { text: '🏓 Pong!' });
        }

        if (texto.toLowerCase() === '!clima') {
            try {
                const apiKey = 'TU_API_KEY_OPENWEATHER';
                const ciudad = 'Zárate,AR';
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`;

                const { data } = await axios.get(url);
                const clima = `🌤️ En ${data.name}: ${data.weather[0].description}, ${data.main.temp}°C, humedad ${data.main.humidity}%`;
                await sock.sendMessage(jid, { text: clima });
            } catch (err) {
                await sock.sendMessage(jid, { text: '⚠️ No pude obtener el clima.' });
            }
        }
    });

    // --- Servidor Express para Webhook de GitHub ---
    const app = express();
    app.use(express.json());

    app.post('/webhook', async (req, res) => {
        console.log('📥 Webhook recibido de GitHub');
        const git = simpleGit();
        await git.pull();

        const numero = '5493487231547@s.whatsapp.net';
        await sock.sendMessage(numero, { text: 'me actualicé' });

        res.sendStatus(200);
    });

    app.listen(3000, () => console.log('🌐 Webhook escuchando en puerto 3000'));
}

startBot();
