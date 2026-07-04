function logger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`${method} ${originalUrl} - ${statusCode} (${duration}ms)`);
  });

  next();
}

module.exports = { logger };
