const { errorResponse } = require("../utils/apiResponse");

function validate(schema) {
  return (req, res, next) => {
    try {
      const validData = schema.parse({
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Update the request with validated (and potentially transformed/trimmed) data
      if (validData.headers) {
        req.headers = Object.assign(req.headers, validData.headers);
      }
      req.body = validData.body;
      req.query = validData.query;
      req.params = validData.params;

      next();
    } catch (error) {
      if (error && error.name === "ZodError") {
        const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return errorResponse(res, 400, `Validation Error: ${errorMessages}`);
      }
      next(error);
    }
  };
}

module.exports = { validate };
