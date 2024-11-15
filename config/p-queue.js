const mysql = require('mysql2/promise');
const PQueue = require('p-queue').default;
const { MySQLStore } = require('p-queue');
const { logger } = require("../utils/logger");
const config = require('../config.global');

const pool = mysql.createPool({
  host: config.MYSQL_HOST,
  user: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD,
  database: config.MYSQL_DATABASE_QUEUE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const queue = new PQueue({
  autoStart: true,
  concurrency: config.CONCURRENCY,
  interval: 100,
  maxRetries: 3,
  store: new PQueue.MySQLStore({ pool }),
});

module.exports = queue;