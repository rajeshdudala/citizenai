// server.js (ES Module version)
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

const verifyToken = "citizenai123"; // Must match the token set in Meta webhook settings
const whatsappToken = process.env.WHATSAPP_TOKEN || ""; // Your WhatsApp Cloud API token

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
    res.sendStatus(403);
  }
});

// 📥 Receive WhatsApp messages (POST)
app.post('/webhook', async (req, res) => {
  const entry = req.body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const msg = changes?.value?.messages?.[0];
  const contact = changes?.value?.contacts?.[0];

  if (msg && contact) {
    console.log("📨 Full incoming msg:", JSON.stringify(msg, null, 2));

    let mediaUrl = null;
    let mimeType = null;
    let mediaType = null;

    // 🧠 Check if media message
    if (['image', 'audio', 'video', 'document'].includes(msg.type)) {
      const mediaObject = msg[msg.type];
      if (mediaObject?.id) {
        const mediaId = mediaObject.id;
        try {
          const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
            headers: {
              Authorization: `Bearer ${whatsappToken}`,
            },
          });
          const mediaData = await mediaRes.json();

          if (mediaData.url) {
            mediaUrl = mediaData.url;
            mimeType = mediaData.mime_type;
            mediaType = msg.type;
          } else {
            console.warn(`⚠️ Media data missing URL or mime_type`, mediaData);
          }
        } catch (error) {
          console.error("❌ Error fetching media info:", error);
        }
      } else {
        console.warn(`⚠️ ${msg.type} message received, but no media ID found in message`);
      }
    }

    const incoming = {
      from: contact.profile.name,
      wa_id: msg.from,
      text: msg.text?.body || '',
      timestamp: msg.timestamp,
      mediaUrl,
      mimeType,
      mediaType,
    };

    whatsappMessages.push(incoming);
    console.log("📥 Stored message:", incoming);
  }

  res.sendStatus(200);
});

// 🔎 Fetch stored WhatsApp messages (GET)
app.get('/messages', (req, res) => {
  res.json(whatsappMessages);
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Express server running at http://localhost:${PORT}`);
});