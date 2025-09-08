const loggingService = require("../services/loggingService");

// Middleware to log API requests
const logApiRequest = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // Log the API call
    loggingService.logApiCall(req, res, duration);

    // Call original end method
    originalEnd.apply(this, args);
  };

  next();
};

// Middleware to log project activities
const logProjectActivity = (action, description) => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Only log if response is successful
      if (res.statusCode < 400) {
        const projectId = req.params.projectId || req.body.projectId;
        if (projectId) {
          loggingService.logProjectActivity(
            projectId,
            action,
            description,
            {
              method: req.method,
              url: req.originalUrl,
              body: req.body,
            },
            req
          );
        }
      }

      originalSend.call(this, data);
    };

    next();
  };
};

// Middleware to log user activities
const logUserActivity = (action, description) => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Only log if response is successful
      if (res.statusCode < 400) {
        const userId = req.user?.userId || req.body.userId;
        if (userId) {
          loggingService.logUserActivity(
            userId,
            action,
            description,
            {
              method: req.method,
              url: req.originalUrl,
            },
            req
          );
        }
      }

      originalSend.call(this, data);
    };

    next();
  };
};

// Error logging middleware
const logError = (error, req, res, next) => {
  loggingService.logError(error, {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: req.user?.userId,
    projectId: req.params.projectId || req.body.projectId,
  });

  next(error);
};

module.exports = {
  logApiRequest,
  logProjectActivity,
  logUserActivity,
  logError,
};
