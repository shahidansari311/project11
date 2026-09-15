function formatZodError(zodError) {
  if (!zodError || !zodError.issues) {
    return {
      message: "Validation failed",
      errors: []
    };
  }

  const formattedErrors = zodError.issues.map(err => ({
    field: err.path[err.path.length - 1] || "unknown",
    message: err.message
  }));

  const mainMessage = formattedErrors.length > 0 ? formattedErrors[0].message : "Validation failed";

  return {
    message: mainMessage,
    errors: formattedErrors
  };
}

module.exports = { formatZodError };
