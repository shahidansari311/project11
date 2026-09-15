const { formatZodError } = require("../utils/zodErrorFormatter");

function validate(schema) {
  return (req, res, next) => {
    try {
      const validData = schema.parse({
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });

      // Update the request with validated (and potentially transformed/trimmed) data
      if (validData.headers !== undefined) {
        req.headers = Object.assign(req.headers, validData.headers);
      }
      if (validData.body !== undefined) req.body = validData.body;
      if (validData.query !== undefined) req.query = validData.query;
      if (validData.params !== undefined) req.params = validData.params;

      next();
    } catch (error) {
      if (error && error.name === "ZodError") {
        const { message, errors } = formatZodError(error);
        return res.status(400).json({
          success: false,
          message,
          errors
        });
      }
      next(error);
    }
  };
}

module.exports = { validate };

