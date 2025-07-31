// server.js (ES Module version)
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const verifyToken = "citizenai123"; // Set this in Meta

// In-memory store for WhatsApp messages
let whatsappMessages = [];

// ✅ Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log("✅ Webhook verified");
    res.status(200).send(challenge);
  } else {
    console.warn("❌ Webhook verification failed");
    res.sendStatus(403);
  }
});

// 📥 Receive WhatsApp messages (POST)
app.post('/webhook', (req, res) => {
  const entry = req.body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const msg = changes?.value?.messages?.[0];
  const contact = changes?.value?.contacts?.[0];

  if (msg && contact) {
    const incoming = {
      from: contact.profile.name,
      wa_id: msg.from,
      text: msg.text?.body || '',
      timestamp: msg.timestamp,
    };

    whatsappMessages.push(incoming);
    console.log("📥 Stored message:", incoming);
  }

  res.sendStatus(200);
});

// 🔎 Fetch stored WhatsApp messages
app.get('/messages', (req, res) => {
  res.json(whatsappMessages);
});

app.listen(PORT, () => {
  console.log(`🚀 Rajesh Express server running at http://localhost:${PORT}`);
});