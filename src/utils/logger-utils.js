import winston from "winston";

const transports = [
  process.env.NODE_ENV !== "development"
    ? new winston.transports.Console()
    : new winston.transports.Console({
        format: winston.format.combine(
          winston.format.cli(),
          winston.format.splat()
        ),
      }),
  new winston.transports.File({ filename: "log.log" }),
];
const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "silly",
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports,
});

export default Logger;
