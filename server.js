// server.js (ES Module version)
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Setup __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());

const verifyToken = "citizenai123"; // Used by Meta Webhook verification
const whatsappToken = process.env.WHATSAPP_TOKEN || ""; // From Meta App Dashboard

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
    res.sendStatus(403);
  }
});

// 📥 Receive WhatsApp messages
app.post('/webhook', async (req, res) => {
  const entry = req.body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const msg = changes?.value?.messages?.[0];
  const contact = changes?.value?.contacts?.[0];

  if (msg && contact) {
    let mediaType = msg.type;
    let mediaId = null;
    let mimeType = null;

    // Handle media (image, audio, etc.)
    if (['image', 'audio', 'video', 'document'].includes(mediaType)) {
      mediaId = msg[mediaType]?.id;
      mimeType = msg[mediaType]?.mime_type;

      if (!mediaId) {
        console.warn("⚠️ No media ID found");
      }
    }

    const incoming = {
      from: contact.profile?.name || 'Unknown',
      wa_id: msg.from,
      text: msg.text?.body || '',
      timestamp: msg.timestamp,
      mediaType: mediaId ? mediaType : null,
      mediaId: mediaId || null,
      mimeType: mimeType || null,
    };

    whatsappMessages.push(incoming);

    console.log("📝 Stored message:", incoming);
  }

  res.sendStatus(200);
});

// 🔎 Fetch stored WhatsApp messages
app.get('/messages', (req, res) => {
  res.json(whatsappMessages);
});

// 📦 Proxy media by ID
app.get('/media/:mediaId', async (req, res) => {
  const mediaId = req.params.mediaId;

  try {
    // Step 1: Get media URL from WhatsApp
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
      },
    });

    const meta = await metaRes.json();

    if (!meta.url) {
      console.error("⚠️ Media data missing URL or mime_type", meta);
      return res.status(400).json({ error: 'Media URL not found' });
    }

    // Step 2: Download the actual media file
    const mediaRes = await fetch(meta.url, {
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
      },
    });

    // Forward content type & stream data to browser
    res.setHeader('Content-Type', mediaRes.headers.get('content-type'));
    mediaRes.body.pipe(res);
  } catch (err) {
    console.error('❌ Failed to proxy media:', err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running at http://localhost:${PORT}`);
});