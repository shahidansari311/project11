const core = require("../property.service.js");

module.exports = {
  createProperty: core.createProperty,
  updateProperty: core.updateProperty,
  getPropertyById: core.getPropertyById,
  getAllProperties: core.getAllProperties,
  removePropertyImage: core.removePropertyImage,
  addPriceHistory: core.addPriceHistory,
  deleteProperty: core.deleteProperty,
};
