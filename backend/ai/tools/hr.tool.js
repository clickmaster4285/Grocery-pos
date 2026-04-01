const User = require('../../models/User');
const mongoose = require('mongoose');

/**
 * HRTool - Handles AI requests related to staff, shifts, and payroll.
 * 
 * @param {string} action - The action to perform (e.g., SHIFT_STATUS, PAYROLL_PREVIEW)
 * @param {object} params - Parameters extracted by the AI
 * @param {string} branchId - The branch ID
 */
async function hrTool(action, params, branchId, userRole) {
   switch (action) {
      
      case 'SHIFT_STATUS':
         const employees = await User.find({
            branch: branchId,
            isActive: true,
            isDeleted: false
         })
         .select('firstName lastName role shift employment.designation')
         .limit(10);

         return employees.map(e => ({
            name: `${e.firstName} ${e.lastName}`,
            role: e.role,
            designation: e.employment?.designation,
            shift: e.shift ? `${e.shift.startTime} - ${e.shift.endTime}` : 'Not Assigned',
            work_days: e.shift?.workDays?.join(', ') || 'N/A'
         }));

      case 'PAYROLL_PREVIEW':
         const payrollData = await User.aggregate([
            { $match: { 
               branch: new mongoose.Types.ObjectId(branchId),
               isActive: true,
               isDeleted: false
            }},
            { $group: {
               _id: "$salary.payType",
               totalBaseSalary: { $sum: "$salary.baseAmount" },
               employeeCount: { $count: {} }
            }}
         ]);

         return payrollData.map(p => ({
            pay_type: p._id || 'UNSPECIFIED',
            total_monthly_estimate: p.totalBaseSalary,
            employee_count: p.employeeCount
         }));

      default:
         throw new Error(`HRTool does not support action: ${action}`);
   }
}

module.exports = hrTool;