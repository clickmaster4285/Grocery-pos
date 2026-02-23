const express = require("express");
const router = express.Router();
const { askModel } = require("../ai/ollama.service");

router.post("/chat", async (req, res) => {
   try {
      const { message } = req.body;

      const reply = await askModel(message);
      res.json({ reply });

      // const rawReply = await askModel(message);
      // const parsed = JSON.parse(rawReply);
      // res.json(parsed);

   } catch (err) {
      console.error(err);
      res.status(500).json({ error: "AI failed" });
   }
});

module.exports = router;