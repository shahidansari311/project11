function successResponse(res, statusCode, data, message = "Success") {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function errorResponse(res, statusCode, message = "Error") {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = {
  successResponse,
  errorResponse
};
