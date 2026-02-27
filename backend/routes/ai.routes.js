const express = require("express");
const router = express.Router();
const { askModel, summarizeData } = require("../ai/ollama.service");
const auth = require("../middleware/auth");
const inventoryTool = require("../ai/tools/inventory.tool");
const salesTool = require("../ai/tools/sales.tool");
const hrTool = require("../ai/tools/hr.tool");
const systemTool = require("../ai/tools/system.tool");

/**
 * POST /ai/chat
 * The main gateway for AI interactions (V2 - Narrator & Smart Search Enabled)
 */
router.post("/chat", auth, async (req, res) => {
   try {
      const { message } = req.body;

      if (!message) {
         return res.status(400).json({ error: "Message is required" });
      }

      // --- STAGE 1: INTENT ROUTING ---
      const rawReply = await askModel(message);
      let intent;
      try {
         intent = JSON.parse(rawReply);
      } catch (parseErr) {
         return res.status(500).json({ success: false, message: "AI Parsing Error" });
      }

      // --- STAGE 2: SMART CLARIFICATION (Fuzzy Search Logic) ---
      // If AI is unsure (0.4 - 0.7 confidence) and has a suggestion
      if (intent.confidence >= 0.4 && intent.confidence < 0.7 && intent.suggestion) {
         return res.json({
            success: true,
            needs_clarification: true,
            message: `I think you might be asking about "${intent.suggestion}". Is that correct?`,
            intent: intent
         });
      }

      // Hard Reject for very low confidence
      if (intent.confidence < 0.4) {
         return res.json({
            success: false,
            message: "I'm sorry, I don't understand that command. Please try again.",
            intent: intent
         });
      }

      // --- STAGE 3: TOOL DISPATCHER ---
      let resultData = null;
      const userBranchId = req.user.branch;

      switch (intent.tool) {
         case "inventory":
            resultData = await inventoryTool(intent.action, intent.params, userBranchId);
            break;
         case "sales":
            resultData = await salesTool(intent.action, intent.params, userBranchId);
            break;
         case "hr":
            resultData = await hrTool(intent.action, intent.params, userBranchId);
            break;
         case "system":
            resultData = await systemTool(intent.action, intent.params);
            break;
         default:
            return res.json({ success: false, message: "Tool not found", intent });
      }

      // --- STAGE 4: THE NARRATOR (Human Response) ---
      const humanResponse = await summarizeData(message, resultData);

      res.json({
         success: true,
         message: humanResponse,
         intent: intent,
         data: resultData
      });

   } catch (err) {
      console.error("AI_ROUTE_ERROR:", err.message);
      res.status(500).json({ success: false, message: "AI processing failed" });
   }
});

module.exports = router;