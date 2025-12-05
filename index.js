const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURACIÓN DEL CLIENTE DE WHATSAPP ---
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './auth_info'
    }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        headless: true,
        args: [
            // Argumentos de estabilidad (ya los tenías)
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-accelerated-2d-canvas',
            
            // --- NUEVOS ARGUMENTOS CLAVE ANTI-MEMORIA (OOM KILL) ---
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-web-security',
            '--autoplay-policy=user-gesture-required',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--process-per-site' // Intentamos esto para ver si reduce la carga inicial
        ],
    }
});
// Generar QR en los logs (para escanear desde la consola de Render)
// Busca esta parte en tu código y REEMPLÁZALA completa:

client.on('qr', (qr) => {
    // 1. Intentamos imprimirlo en terminal (por si acaso)
    console.log('QR RECIBIDO (Intentando mostrar en terminal):');
    qrcode.generate(qr, { small: true });
    
    // 2. LA SOLUCIÓN: Generamos una URL externa para ver el QR
    // Usamos una API pública segura (goqr.me o qrserver) para dibujar el código
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;

    console.log('\n⚠️ SI EL QR DE ARRIBA SE VE DEFORME, HAZ CLIC AQUÍ: ⚠️');
    console.log('👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇');
    console.log(qrUrl);
    console.log('👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆\n');
});

client.on('ready', () => {
    console.log('✅ Cliente de WhatsApp CONECTADO y listo!');
});

client.on('auth_failure', msg => {
    console.error('❌ Error de autenticación:', msg);
});

client.initialize();

// --- API PARA RECIBIR MENSAJES ---
app.post('/enviar-mensaje', async (req, res) => {
    const { numero, mensaje } = req.body;

    if (!numero || !mensaje) {
        return res.status(400).json({ error: 'Faltan datos (numero, mensaje)' });
    }

    // Formateo simple para Venezuela: Si viene "0424..." lo cambiamos a "58424..."
    let chatId = numero;
    if (chatId.startsWith('0')) {
        chatId = '58' + chatId.substring(1);
    }
    // Agregar el sufijo de WhatsApp
    chatId = `${chatId}@c.us`;

    try {
        // Verificar si el cliente está listo
        const estado = await client.getState();
        if (!estado) {
            return res.status(503).json({ error: 'El bot no está listo aún' });
        }

        await client.sendMessage(chatId, mensaje);
        console.log(`Mensaje enviado a ${numero}`);
        res.json({ success: true, message: 'Enviado correctamente' });

    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: 'Error interno al enviar mensaje' });
    }
});

// Puerto dinámico (Render inyecta PORT automáticamente)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🤖 Servidor escuchando en puerto ${PORT}`);
});