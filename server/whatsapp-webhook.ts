const express = require("express");
const router = express.Router();

const VERIFY_TOKEN = "citizenai123";

// GET route for webhook verification
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// POST route for incoming WhatsApp messages
router.post("/", (req, res) => {
  console.log("📩 Received WhatsApp message:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

module.exports = router;