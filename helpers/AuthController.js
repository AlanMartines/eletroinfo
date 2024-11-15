const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require("../utils/logger");
const authConfig = require('../config/auth');
//
//
exports.registerToken = (SessionName) => {
	//
	logger.info(`- Register JWT`);
	//
	if (SessionName) {
		return jwt.sign({ token: SessionName }, authConfig.secret, {
			expiresIn: authConfig.expiresIn
		});
	}else{
		return false;
	}
}
//
exports.verifyToken = (tokenJwt) => {
	//
	logger.info(`- Verify JWT`);
	//
	if (tokenJwt) {
		return jwt.verify(tokenJwt, authConfig.secret, function (err, decodedToken) {
			if (err) {
				return false;
			} else {
				return true;
			}
		});
	}else{
		return false;
	}
}
//
//
exports.jwtRegister = async (tokenJwt) => {
	//
	logger.info(`- Register JWT`);
	//
	if (tokenJwt) {
		return new Promise((resolve, reject) => {
			jwt.sign(tokenJwt, authConfig.secret, { expiresIn: authConfig.expiresIn }, (err, asyncToken) => {
				if (err || !asyncToken){
					return reject(false);
				}
				return resolve(asyncToken);
			});
		});
	}else{
		return false;
	}
}
//
exports.jwtVerify = async (tokenJwt) => {
	//
	logger.info(`- Verify JWT`);
	//
	if (tokenJwt) {
		return new Promise((resolve, reject) => {
			jwt.verify(tokenJwt, authConfig.secret, (err, decodedToken) => {
				if (err || !decodedToken){
					return reject(false);
				}
				return resolve(true);
			});
		});
	}else{
		return false;
	}
}