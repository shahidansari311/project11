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
        // Return a simple, plain English list of what went wrong
        const formattedErrors = error.issues.map(err => ({
          field: err.path[err.path.length - 1], // Just the field name, e.g. 'title'
          message: err.message
        }));
        
        // Use the first error as the main message for easy Toast notifications, 
        // but keep the full array so the frontend can highlight specific fields.
        const mainMessage = formattedErrors.length > 0 ? formattedErrors[0].message : "Validation failed";
        
        return res.status(400).json({
          success: false,
          message: mainMessage,
          errors: formattedErrors
        });
      }
      next(error);
    }
  };
}

module.exports = { validate };
