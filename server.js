import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './src/integrations/supabase/client.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());

const verifyToken = "citizenai123";
const whatsappToken = process.env.WHATSAPP_TOKEN || "";

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

    if (['image', 'audio', 'video', 'document'].includes(mediaType)) {
      mediaId = msg[mediaType]?.id;
      mimeType = msg[mediaType]?.mime_type;
    }

    const incoming = {
      from: contact.profile?.name || 'Unknown',
      wa_id: msg.from,
      text: msg.text?.body || '',
      timestamp: parseInt(msg.timestamp),
      media_type: mediaId ? mediaType : null,
      media_id: mediaId || null,
      mime_type: mimeType || null,
    };

    try {
      const { error } = await supabase.from('whatsapp_messages').insert([incoming]);
      if (error) {
        console.error("❌ Supabase insert error:", error);
      } else {
        console.log("✅ Message saved to Supabase:", incoming);
      }
    } catch (err) {
      console.error("❌ Failed to insert into Supabase:", err);
    }
  }

  res.sendStatus(200);
});

// 🔎 Fetch WhatsApp messages from Supabase
app.get('/messages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ Supabase fetch error:", error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Unexpected error fetching messages:", err);
    res.sendStatus(500);
  }
});

// 📦 Proxy media by ID
app.get('/media/:mediaId', async (req, res) => {
  const mediaId = req.params.mediaId;

  try {
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
      },
    });

    const meta = await metaRes.json();

    if (!meta.url) {
      console.error("⚠️ Media data missing URL", meta);
      return res.status(400).json({ error: 'Media URL not found' });
    }

    const mediaRes = await fetch(meta.url, {
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
      },
    });

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