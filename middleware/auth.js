const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      error: "API key is required",
      message: "Please provide x-api-key header",
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: "Invalid API key",
      message: "The provided API key is not valid",
    });
  }

  next();
};

module.exports = { apiKeyAuth };
