const Branch = require('../../models/branch.model');
const Terminal = require('../../models/terminal.model');

/**
 * SystemTool - Handles global, non-branch-isolated queries like branch counts 
 * or system-wide metadata.
 * 
 * @param {string} action - The action to perform (e.g., BRANCH_COUNT)
 * @param {object} params - Parameters extracted by the AI
 * @param {string} branchId - The branch ID (optional for global queries)
 * @param {string} userRole - The role of the current user
 */
async function systemTool(action, params, branchId, userRole) {
   switch (action) {
      
      case 'BRANCH_COUNT':
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
            capabilities: ["Inventory", "Sales", "HR", "AI-Analytics", "CRM", "Logistics", "Finance"]
         };

      case 'TERMINAL_STATUS':
         // Checks the status of terminals in a specific branch
         const terminals = await Terminal.find({ 
            branch: branchId,
            isActive: true 
         })
         .select('name terminalId status activeSession department')
         .populate('activeSession.userId', 'firstName lastName');

         return terminals.map(t => ({
            name: t.name,
            id: t.terminalId,
            status: t.status,
            department: t.department,
            current_cashier: t.activeSession?.userId ? `${t.activeSession.userId.firstName} ${t.activeSession.userId.lastName}` : 'No Active Session',
            drawer_balance: t.activeSession?.currentDrawerBalance || 0
         }));

      case 'WHO_AM_I':
         // Returns identity info about the current user
         const branch = await Branch.findById(branchId).select('branch_name');
         return {
            role: userRole,
            assigned_branch: branch?.branch_name || 'Global/Unknown'
         };

      default:
         throw new Error(`SystemTool does not support action: ${action}`);
   }
}

module.exports = systemTool;