const core = require("../property.service.js");

module.exports = {
  getAllProperties: core.getAllProperties,
  getPropertyById: core.getPropertyById,
  getPropertyFilters: core.getPropertyFilters,
  getLocationSuggestions: core.getLocationSuggestions,
  getPropertyInvestmentInfo: core.getPropertyInvestmentInfo,
};
