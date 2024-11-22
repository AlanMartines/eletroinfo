require('dotenv').config();
const config = module.exports = {};
//
config.NODE_ENV = process.env.NODE_ENV || "production";
config.HOST = process.env.HOST || "localhost";
config.PORT = process.env.PORT || "8001";
config.DOMAIN_SSL = process.env.DOMAIN_SSL || "";
config.LOCALE = process.env.LOCALE || "pt-BR";
//