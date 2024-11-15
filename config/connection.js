const mysql = require('mysql2');
const config = require('../config.global');

connection = mysql.createConnection({
	host: config.MYSQL_HOST,
	port: config.MYSQL_PORT,
	user: config.MYSQL_USER,
	password: config.MYSQL_PASSWORD,
	database: config.MYSQL_DATABASE,
});
connection = connection.promise();
module.exports = connection;