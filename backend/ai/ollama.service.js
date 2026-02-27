const axios = require("axios");

/**
 * askModel - Phase 2: Intent Router
 * Translates user text into a structured command (JSON).
 * Added 'suggestion' field to help with misspellings/smart search.
 */
async function askModel(userMessage) {
   
   const systemPrompt = `
You are the "Intent Router" for an enterprise Supermarket POS system.
Your job is to translate user requests into a valid JSON command.

### CRITICAL RULES:
1. Return ONLY valid JSON.
2. No conversational text or explanations.
3. If confidence is below 0.7, provide a "suggestion" of what you think the user meant.
4. Action names MUST be uppercase.

### TOOL REGISTRY:
1. inventory (Actions: LOW_STOCK, SEARCH_PRODUCT, CATEGORY_SUMMARY)
2. sales (Actions: TODAY_SUMMARY, TOP_PRODUCTS, BRANCH_PERFORMANCE)
3. hr (Actions: SHIFT_STATUS, PAYROLL_PREVIEW)
4. system (Actions: BRANCH_COUNT, GENERAL_INFO)

### JSON SCHEMA:
{
  "schema_version": "1.0.0",
  "tool": "string",
  "action": "string",
  "params": { "filter": "string", "limit": "number", "timeframe": "string" },
  "confidence": "number (0.0 - 1.0)",
  "suggestion": "string|null"
}

### FEW-SHOT EXAMPLES:
User: "how many brcnhse i have ?"
Result: {"schema_version":"1.0.0","tool":"system","action":"BRANCH_COUNT","params":{},"confidence":0.55,"suggestion":"total number of branches"}

User: "is John working?"
Result: {"schema_version":"1.0.0","tool":"hr","action":"SHIFT_STATUS","params":{"filter":"John"},"confidence":0.95,"suggestion":null}
`;

   const finalPrompt = `${systemPrompt}\nUser Query: "${userMessage}"\nResult:`;

   try {
      const response = await axios.post("http://localhost:11434/api/generate", {
         model: "phi3:mini",
         prompt: finalPrompt,
         stream: false,
         options: { temperature: 0.0, num_ctx: 4096, num_predict: 128 },
         format: "json"
      });

      return response.data.response;

   } catch (error) {
      console.error("AI_INFERENCE_ERROR:", error.message);
      return JSON.stringify({ tool: "system", action: "ERROR", confidence: 0 });
   }
}

/**
 * summarizeData - Phase 3: The Narrator Layer
 * Takes the raw database data and turns it into a human-friendly sentence.
 */
async function summarizeData(userQuery, jsonData) {
   const systemPrompt = `
You are the "Voice of the POS". 
Take the provided JSON data and answer the user's original query in 1-2 friendly, professional sentences.
Do NOT mention "JSON" or "data structures". Just speak naturally.

User Query: "${userQuery}"
Database Result: ${JSON.stringify(jsonData)}
`;

   try {
      const response = await axios.post("http://localhost:11434/api/generate", {
         model: "phi3:mini",
         prompt: systemPrompt,
         stream: false,
         options: { temperature: 0.7, num_ctx: 2048, num_predict: 256 }
      });

      return response.data.response;

   } catch (error) {
      return "I have the data, but I'm having trouble explaining it clearly. Please check the results below.";
   }
}

module.exports = { askModel, summarizeData };