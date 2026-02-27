const axios = require("axios");

/**
 * askModel - The core interface for communicating with the local Ollama LLM.
 * This service transforms natural language into a structured "Intent JSON" 
 * that the backend can actually execute.
 */
async function askModel(userMessage) {
   
   // --- SYSTEM MANIFEST & PROMPT ---
   // This is the "brain" of the AI. We define exactly how it should behave,
   // what tools it has access to, and the strict format it MUST return.
   const systemPrompt = `
You are the "Intent Router" for an enterprise Supermarket POS system.
Your job is to translate user requests into a valid JSON command.

### CRITICAL RULES:
1. Return ONLY valid JSON.
2. No markdown blocks (e.g., no \`\`\`json).
3. No conversational text or explanations.
4. If confidence is low, set confidence < 0.4.
5. Action names MUST be uppercase.

### TOOL REGISTRY:
1. inventory (Actions: LOW_STOCK, SEARCH_PRODUCT, CATEGORY_SUMMARY)
2. sales (Actions: TODAY_SUMMARY, TOP_PRODUCTS, BRANCH_PERFORMANCE)
3. hr (Actions: SHIFT_STATUS, PAYROLL_PREVIEW)

### JSON SCHEMA:
{
  "schema_version": "1.0.0",
  "tool": "string",
  "action": "string",
  "params": {
    "filter": "string|null",
    "limit": "number|null",
    "timeframe": "string|null",
    "threshold": "number|null"
  },
  "confidence": "number (0.0 - 1.0)"
}

### FEW-SHOT EXAMPLES (Training the model):
User: "What items are running out?"
Result: {"schema_version":"1.0.0","tool":"inventory","action":"LOW_STOCK","params":{"threshold":10,"limit":10},"confidence":0.98}

User: "Show me the top 5 sales for today"
Result: {"schema_version":"1.0.0","tool":"sales","action":"TOP_PRODUCTS","params":{"limit":5,"timeframe":"today"},"confidence":0.95}

User: "Is John on shift right now?"
Result: {"schema_version":"1.0.0","tool":"hr","action":"SHIFT_STATUS","params":{"filter":"John","timeframe":"current"},"confidence":0.90}
`;

   // Combine the system instructions with the actual user message
   const finalPrompt = `${systemPrompt}\nUser Query: "${userMessage}"\nResult:`;

   try {
      // --- OLLAMA API CALL ---
      // We send the prompt to our local Ollama server.
      const response = await axios.post(
         "http://localhost:11434/api/generate",
         {
            model: "phi3:mini",
            prompt: finalPrompt,
            stream: false, // Wait for the full response before returning
            options: {
               temperature: 0.0, // Force the model to be deterministic (no "creativity")
               num_ctx: 4096,    // Set context window size
               num_predict: 128  // Limit output length for routing
            },
            format: "json" // Tells Ollama to strictly enforce JSON output
         }
      );

      // Return the raw text string (which should now be pure JSON)
      return response.data.response;

   } catch (error) {
      console.error("AI_INFERENCE_ERROR:", error.message);
      // Fallback for when the local AI server is offline or unreachable
      return JSON.stringify({
         tool: "system",
         action: "ERROR",
         params: { message: "AI Engine Unreachable" },
         confidence: 0
      });
   }
}

module.exports = { askModel };