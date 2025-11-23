// mega-agency-bot/index.js
// Simple Venom-based WhatsApp bot which registers with Bridge and forwards incoming messages.

const venom = require('venom-bot');
const axios = require('axios');

const SESSION_NAME = process.env.SESSION_NAME || 'MegaAgencySession';
const BRIDGE_URL = process.env.WHATSAPP_BRIDGE_URL || 'https://web-production-5baae.up.railway.app'; // change if needed
const CALLBACK_PORT = process.env.CALLBACK_PORT || 3001;
const CALLBACK_BASE = process.env.CALLBACK_BASE || `http://localhost:${CALLBACK_PORT}`; // public URL if behind proxy
const REGISTER_PATH = '/register';
const SEND_ENDPOINT = '/send-to-whatsapp';

// Start Express server to receive send requests from Bridge
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

let clientInstance = null;
let SESSION = SESSION_NAME;

// Accept /send-to-whatsapp from Bridge
app.post(SEND_ENDPOINT, async (req, res) => {
  try {
    const { to, message } = req.body;
    if(!clientInstance) return res.status(500).send({ error: 'Client not ready' });
    // venom client expects number@c.us
    const toId = String(to).includes('@') ? to : `${to}@c.us`;
    await clientInstance.sendText(toId, message || '');
    return res.send({ ok: true });
  } catch (err) {
    console.error('Error sending message', err?.message || err);
    return res.status(500).send({ error: err?.message || 'send failed' });
  }
});

// basic health
app.get('/health', (req, res) => res.send({ ok: true }));

app.listen(CALLBACK_PORT, async () => {
  console.log(`Bot callback server listening at ${CALLBACK_BASE}`);
  // start venom client
  startVenom();
});

async function registerWithBridge(publicCallbackUrl){
  try {
    const registerUrl = `${BRIDGE_URL}${REGISTER_PATH}`;
    const payload = {
      session: SESSION,
      callbackUrl: `${publicCallbackUrl}${SEND_ENDPOINT}` // bridge will use this to instruct bot to send
    };
    console.log('Registering with bridge', registerUrl, payload);
    await axios.post(registerUrl, payload, { timeout: 10000 });
    console.log('Registered with bridge successfully.');
  } catch (err) {
    console.error('Register with bridge failed:', err?.message || err);
  }
}

function startVenom(){
  venom
    .create(SESSION, undefined, (statusSession, session) => {
      console.log('StatusSession: ', statusSession);
      // optional log
    }, {
      headless: true,
      disableSpins: true,
      useChrome: true
    })
    .then(client => {
      clientInstance = client;
      console.log('Venom client started. Session:', SESSION);

      // Register with bridge (provide public callback url)
      // NOTE: If running behind Render/Railway with public URL, set CALLBACK_BASE to that public URL via env.
      registerWithBridge(CALLBACK_BASE);

      // On incoming message, forward to Bridge /webhook
      client.onMessage(async msg => {
        try {
          // prepare payload
          const payload = {
            from: msg.from, // e.g., 92300xxxxxxx@c.us
            body: msg.body || '',
            timestamp: msg.timestamp || Date.now(),
            // if media present, provide media URLs via venom's download (skip heavy)
            isMedia: msg.isMedia || false
          };
          console.log('Incoming message:', payload.from, payload.body);
          // post to Bridge
          await axios.post(`${BRIDGE_URL}/webhook`, payload, { timeout: 10000 });
        } catch (err) {
          console.error('Forward to Bridge failed:', err?.message || err);
        }
      });
    })
    .catch(err => {
      console.error('Venom start error', err?.message || err);
      process.exit(1);
    });
}
