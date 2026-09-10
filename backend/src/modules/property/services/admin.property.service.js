const core = require("../property.service.js");

module.exports = {
  createProperty: core.createProperty,
  updateProperty: core.updateProperty,
  deleteProperty: core.deleteProperty,
  removePropertyImage: core.removePropertyImage,
  addPriceHistory: core.addPriceHistory,
  editPriceHistory: core.editPriceHistory,
  deletePriceHistory: core.deletePriceHistory,
  updatePropertyStatus: core.updatePropertyStatus,
};
