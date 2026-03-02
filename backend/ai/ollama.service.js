const axios = require("axios");

/**
 * askModel - Phase 2: Intent Router (V3 - Identity & Authority Aware)
 * Translates user text into a structured command (JSON).
 * @param {string} userMessage - The raw user query
 * @param {object} userContext - { firstName, role, branch }
 */
async function askModel(userMessage, userContext = {}) {
   const { firstName, role, branch } = userContext;
   
   const systemPrompt = `
You are the "Intent Router" for an enterprise Supermarket POS system.
The current user is "${firstName}" with the role of "${role}".
User's Primary Branch ID: "${branch}".

### AUTHORITY RULES:
1. If role is "admin", the user can query ANY branch or ALL branches. 
2. If role is NOT "admin", the user is strictly restricted to their own branch ("${branch}"). 
3. If an admin asks for a specific branch by name (e.g., "Branch A"), extract that as "branchId" in params.

### CRITICAL RULES:
1. Return ONLY valid JSON.
2. No conversational text or explanations.
3. If confidence is below 0.7, provide a "suggestion" of what you think the user meant.
4. Action names MUST be uppercase.

### TOOL REGISTRY:
1. inventory (Actions: LOW_STOCK, SEARCH_PRODUCT, CATEGORY_SUMMARY, LOCATION_STATUS)
2. sales (Actions: TODAY_SUMMARY, TOP_PRODUCTS, BRANCH_PERFORMANCE, SALES_COMPARISON)
3. hr (Actions: SHIFT_STATUS, PAYROLL_PREVIEW)
4. system (Actions: BRANCH_COUNT, GENERAL_INFO, TERMINAL_STATUS)
5. crm (Actions: TOP_CUSTOMERS, CUSTOMER_HISTORY)
6. finance (Actions: RETURNS_SUMMARY, PROFIT_ANALYSIS)
7. logistics (Actions: SUPPLIER_LIST, STOCK_TRANSFERS)

### JSON SCHEMA:
{
  "schema_version": "1.1.0",
  "tool": "string",
  "action": "string",
  "params": { 
    "filter": "string", 
    "limit": "number", 
    "timeframe": "string", 
    "branchId": "string (Optional - for admin branch selection)" 
  },
  "confidence": "number (0.0 - 1.0)",
  "suggestion": "string|null"
}

### FEW-SHOT EXAMPLES:
User: "Compare sales between Branch A and Branch B"
Result: {"schema_version":"1.1.0","tool":"sales","action":"SALES_COMPARISON","params":{"filter":"Branch A, Branch B"},"confidence":0.98,"suggestion":null}

User: "Who are my top 5 customers?"
Result: {"schema_version":"1.1.0","tool":"crm","action":"TOP_CUSTOMERS","params":{"limit":5},"confidence":0.95,"suggestion":null}
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
 * summarizeData - Phase 3: The Narrator Layer (V2 - Personalized)
 * Takes the raw database data and turns it into a human-friendly sentence.
 */
async function summarizeData(userQuery, jsonData, userContext = {}) {
   const { firstName } = userContext;
   const systemPrompt = `
You are the "Voice of the POS". 
Your name is "Gemini Assistant". 
Greet the user "${firstName}" naturally in your response.
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
      return `Hi ${firstName}, I have the data, but I'm having trouble explaining it clearly. Please check the results below.`;
   }
}

module.exports = { askModel, summarizeData };