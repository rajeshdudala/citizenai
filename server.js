import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const verifyToken = "citizenai123"; // Meta webhook verify token
const whatsappToken = process.env.WHATSAPP_TOKEN || ""; // WhatsApp Cloud API access token

let whatsappMessages = [];

// ✅ Webhook verification
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

// 📥 Handle incoming WhatsApp message webhook
app.post('/webhook', async (req, res) => {
  const entry = req.body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const msg = changes?.value?.messages?.[0];
  const contact = changes?.value?.contacts?.[0];

  if (msg && contact) {
    let mediaUrl = null;
    let mimeType = null;
    let mediaType = null;
    let text = '';

    // If it's a text message
    if (msg.type === 'text') {
      text = msg.text?.body || '';
    }

    // If it's a media message
    if (['image', 'audio', 'video', 'document'].includes(msg.type)) {
      try {
        mediaType = msg.type;
        const mediaId = msg[msg.type].id;

        const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
          },
        });

        const mediaData = await mediaRes.json();
        mimeType = mediaData.mime_type;
        mediaUrl = mediaData.url;
      } catch (err) {
        console.error("❌ Failed to fetch media metadata:", err);
      }
    }

    const incoming = {
      from: contact.profile.name,
      wa_id: msg.from,
      text,
      timestamp: msg.timestamp,
      mediaUrl,
      mimeType,
      mediaType,
    };

    whatsappMessages.push(incoming);
    console.log("📥 Stored message:", JSON.stringify(incoming, null, 2));
  }

  res.sendStatus(200);
});

// 🔎 Endpoint to get all stored WhatsApp messages
app.get('/messages', (req, res) => {
  res.json(whatsappMessages);
});

app.listen(PORT, () => {
  console.log(`🚀 Citizen AI Express server running at http://localhost:${PORT}`);
});