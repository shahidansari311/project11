const core = require("../investment.service.js");

module.exports = {
  createInvestment: core.createInvestment,
  signAdminInvestment: core.signAdminInvestment,
  cancelInvestment: core.cancelInvestment,
  getUserInvestments: core.getUserInvestments,
  getUserInvestmentById: core.getUserInvestmentById,
  payRemainingInvestment: core.payRemainingInvestment,
  requestRefund: core.requestRefund,
  requestWithdrawal: core.requestWithdrawal,
};
