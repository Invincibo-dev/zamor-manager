const path = require("path");

const winston = require("winston");

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const isProduction = process.env.NODE_ENV === "production";

const devFormat = combine(
  errors({ stack: true }),
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return stack
      ? `${ts} [${level}] ${message}\n${stack}`
      : `${ts} [${level}] ${message}`;
  })
);

const prodFormat = combine(errors({ stack: true }), timestamp(), json());

const transports = [new winston.transports.Console()];

if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: isProduction ? prodFormat : devFormat,
  transports,
  exitOnError: false,
});

module.exports = logger;
