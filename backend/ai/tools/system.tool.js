const Branch = require('../../models/branch.model');

/**
 * SystemTool - Handles global, non-branch-isolated queries like branch counts 
 * or system-wide metadata.
 * 
 * @param {string} action - The action to perform (e.g., BRANCH_COUNT)
 * @param {object} params - Parameters extracted by the AI
 */
async function systemTool(action, params) {
   switch (action) {
      
      case 'BRANCH_COUNT':
         // We count all active, non-deleted branches
         const activeBranches = await Branch.countDocuments({ 
            status: 'ACTIVE', 
            isDeleted: false 
         });
         
         const branchNames = await Branch.find({ 
            status: 'ACTIVE', 
            isDeleted: false 
         }).select('branch_name -_id');

         return {
            total_active_branches: activeBranches,
            branches: branchNames.map(b => b.branch_name)
         };

      case 'GENERAL_INFO':
         return {
            system_name: "Supermarket Management System (SMS)",
            version: "V2.0-Enterprise",
            capabilities: ["Inventory", "Sales", "HR", "AI-Analytics"]
         };

      default:
         throw new Error(`SystemTool does not support action: ${action}`);
   }
}

module.exports = systemTool;