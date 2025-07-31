// server.js (ES Module version)
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// WhatsApp Webhook Verification (GET)
app.get('/webhook', (req, res) => {
  const verifyToken = "citizenai123"; // Make sure this matches Meta settings

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

// WhatsApp Webhook Message Receiver (POST)
app.post('/webhook', (req, res) => {
  console.log('📩 Incoming WhatsApp message:\n', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running at http://localhost:${PORT}`);
});