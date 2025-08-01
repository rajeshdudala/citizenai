// server.ts (TypeScript with Supabase)
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { supabase } from './src/integrations/supabase/client.ts';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());

const verifyToken = 'citizenai123';
const whatsappToken = process.env.WHATSAPP_TOKEN || '';

// ✅ Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verified');
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
      timestamp: msg.timestamp,
      media_type: mediaId ? mediaType : null,
      media_id: mediaId || null,
      mime_type: mimeType || null,
    };

    console.log('📥 Incoming WhatsApp message:', JSON.stringify(incoming, null, 2));

    // ⬇️ Store to Supabase
    const { data, error, status, statusText } = await supabase
      .from('whatsapp_messages')
      .insert([incoming]);

    if (error) {
      console.error('❌ Supabase insert error:');
      console.error('Status:', status, statusText);
      console.error('Details:', error.details);
      console.error('Message:', error.message);
      console.error('Hint:', error.hint);
    } else {
      console.log('✅ Stored in Supabase:', data);
    }
  } else {
    console.warn('⚠️ Webhook triggered but message or contact is missing');
  }

  res.sendStatus(200);
});

// 🔎 Fetch messages from Supabase
app.get('/messages', async (req, res) => {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Error fetching messages from Supabase:', error.message);
    return res.status(500).json({ error: 'Failed to load messages' });
  }

  res.json(data);
});

// 📦 Proxy media
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
      console.error('⚠️ Media data missing URL or mime_type', meta);
      return res.status(400).json({ error: 'Media URL not found' });
    }

    const mediaRes = await fetch(meta.url, {
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
      },
    });

    res.setHeader('Content-Type', mediaRes.headers.get('content-type') || 'application/octet-stream');
    mediaRes.body.pipe(res);
  } catch (err) {
    console.error('❌ Failed to proxy media:', err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});