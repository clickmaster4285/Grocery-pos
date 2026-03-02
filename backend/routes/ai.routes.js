const express = require("express");
const router = express.Router();
const { askModel, summarizeData } = require("../ai/ollama.service");
const auth = require("../middleware/auth");
const inventoryTool = require("../ai/tools/inventory.tool");
const salesTool = require("../ai/tools/sales.tool");
const hrTool = require("../ai/tools/hr.tool");
const systemTool = require("../ai/tools/system.tool");
const crmTool = require("../ai/tools/crm.tool");
const financeTool = require("../ai/tools/finance.tool");
const logisticsTool = require("../ai/tools/logistics.tool");

/**
 * POST /ai/chat
 * The main gateway for AI interactions (V3 - Personalized & Role-Aware)
 */
router.post("/chat", auth, async (req, res) => {
   try {
      const { message } = req.body;

      if (!message) {
         return res.status(400).json({ error: "Message is required" });
      }

      // --- STAGE 1: INTENT ROUTING (Identity Aware) ---
      const userContext = {
         firstName: req.user.firstName,
         role: req.user.role,
         branch: req.user.branch
      };

      console.log("the userContext is ", userContext)

      const rawReply = await askModel(message, userContext);
      let intent;
      try {
         intent = JSON.parse(rawReply);
      } catch (parseErr) {
         return res.status(500).json({ success: false, message: "AI Parsing Error" });
      }

      // --- STAGE 2: SMART CLARIFICATION (Fuzzy Search Logic) ---
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
      // Admins can override branch if intent provides a specific branchId
      const effectiveBranchId = (req.user.role === 'admin' && intent.params?.branchId) 
         ? intent.params.branchId 
         : req.user.branch;

      const userRole = req.user.role;
      console.log("the log before userrole")
      console.log("the userRole is ", userRole )
console.log("the log after userrole")
      switch (intent.tool) {
         case "inventory":
            resultData = await inventoryTool(intent.action, intent.params, effectiveBranchId, userRole);
            break;
         case "sales":
            resultData = await salesTool(intent.action, intent.params, effectiveBranchId, userRole);
            break;
         case "hr":
            resultData = await hrTool(intent.action, intent.params, effectiveBranchId, userRole);
            break;
         case "system":
            resultData = await systemTool(intent.action, intent.params, effectiveBranchId, userRole);
            break;
         case "crm":
            resultData = await crmTool(intent.action, intent.params, effectiveBranchId, userRole);
            break;
         case "finance":
            resultData = await financeTool(intent.action, intent.params, effectiveBranchId, userRole);
            break;
         case "logistics":
            resultData = await logisticsTool(intent.action, intent.params, effectiveBranchId, userRole);
            break;
         default:
            return res.json({ success: false, message: "Tool not found", intent });
      }

      // --- STAGE 4: THE NARRATOR (Human Response) ---
      const humanResponse = await summarizeData(message, resultData, userContext);

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