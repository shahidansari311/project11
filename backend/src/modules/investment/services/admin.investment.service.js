const core = require("../investment.service.js");

module.exports = {
  createInvestmentOnBehalf: core.createInvestmentOnBehalf,
  getAllInvestments: core.getAllInvestments,
  getInvestmentStats: core.getInvestmentStats,
  getInvestmentById: core.getInvestmentById,
  getInvestmentsByProperty: core.getInvestmentsByProperty,
  getInvestmentsByUser: core.getInvestmentsByUser,
  approveInvestment: core.approveInvestment,
  rejectInvestment: core.rejectInvestment,
  processRefund: core.processRefund,
  processWithdrawal: core.processWithdrawal,
};
