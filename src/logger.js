const log = (level, message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}]: ${message}`);
};

module.exports = {
  info: (message) => log('info', message),
  warn: (message) => log('warn', message),
  error: (message) => log('error', message)
};
