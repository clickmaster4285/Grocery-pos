const axios = require("axios");

async function askModel(userMessage) {

   const systemPrompt = `
You are an AI assistant for a Supermarket POS system.

Your job is to detect the user's intent.

Return ONLY valid JSON.
Do NOT explain anything.
Do NOT add extra text.

Available tools:

1. inventory
   Actions:
   - LOW_STOCK
   - SEARCH_PRODUCT
   - BARCODE_LOOKUP

2. sales
   Actions:
   - TODAY_SUMMARY
   - TOP_PRODUCTS
   - BRANCH_PERFORMANCE

3. hr
   Actions:
   - PAYROLL_SUMMARY
   - ATTENDANCE_REPORT

Example output:
{
  "tool": "inventory",
  "action": "LOW_STOCK",
  "threshold": 10
}
`;

   const finalPrompt = systemPrompt + "\nUser: " + userMessage;

   const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
         model: "phi3:mini",
         prompt: finalPrompt,
         stream: false
      }
   );

   return response.data.response;
}

module.exports = { askModel };