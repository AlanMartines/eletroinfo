//
const express = require("express");
const router = express.Router();
const https = require('https');
const axios = require('axios');
const mime = require('mime-types');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const { Tokens, TokenAsName, Sequelize, Statistics } = require('../models');
const config = require('../config.global');
const { logger } = require('../utils/logger');
const validateOffLine = require("../middleware/validateOffLine");
const actionNotify = require("../middleware/actionNotify");
const fnSocket = require('../controllers/fnSockets');
const Command = require("../functions/commands");
const agent = new https.Agent({
	rejectUnauthorized: false
});
const verifyToken = require("../middleware/verifyToken");
//
// Função para validar a base64
function isValidBase64(str) {
	try {
		return Buffer.from(str, 'base64').toString('base64') === str;
	} catch (error) {
		return false;
	}
}
//
function ensureInteger(string) {
	if (Number.isInteger(string)) {
		return string;
	} else {
		return parseInt(string, 10); // O segundo argumento '10' é a base (decimal)
	}
}
//
async function checkContent(message, SessionName, userid) {
	//
	if (message.includes("Erro ao processar a solicitação.")) {
		result = {
			"message": "Erro ao processar a solicitação."
		};
		//
	} else if (message.includes("item-not-found")) {
		result = {
			"message": "Error: item-not-found"
		};
		//
	} else if (message.includes("no account exists")) {
		//
		result = {
			"number": userid,
			"message": "O número informado não pode receber mensagens via whatsapp"
		};
		//
		await actionNotify.action(SessionName, `\n*Motivo:* ${result.message}\n*Numero:* ${result.number}`);
		//
		return result;
		//
	} else if (message.includes("Grupo não existe")) {
		//
		result = {
			"grupo": userid,
			"message": "O Grupo informado não existe"
		};
		//
		await actionNotify.action(SessionName, `\n*Motivo:* ${result.message}\n*Grupo:* ${result.grupo}`);
		//
		return result;
		//
	} else if (message.includes("phone isn't connected")) {
		result = {
			"message": "Por favor, acesse https://painel.connectzap.com.br, faça o login e realize a conexão."
		};
		//
		await validateOffLine.verify(SessionName);
		//
		return result;
		//
	}
}
//
async function contentMonitor(statistic, SessionName) {
	//
	const today = new Date().toISOString().split('T')[0];
	//
	if (statistic == 'success') {
		//
		let content = await Statistics.findOrCreate({
			where: {
				token: SessionName,
				date: today
			},
			defaults: {
				success: 1,
				error: 0
			}
		}).then(([monitor, created]) => {
			if (!created) {
				monitor.success += 1;
				return monitor.save();
			} else {
				logger?.info(`- Success update statistics`);
			}
		}).then(async (entries) => {
			logger?.info(`- Success update statistics`);
		}).catch(async (err) => {
			logger?.error(`- Error update statistics`);
		});
		//
		return content;
		//
	} else {
		//
		let content = await Statistics.findOrCreate({
			where: {
				token: SessionName,
				date: today
			},
			defaults: {
				success: 0,
				error: 1
			}
		}).then(([monitor, created]) => {
			if (!created) {
				monitor.error += 1;
				return monitor.save();
			} else {
				logger?.info(`- Success update statistics`);
			}
		}).then(async (entries) => {
			logger?.info(`- Success update statistics`);
		}).catch(async (err) => {
			logger?.error(`- Error update statistics`);
		});
		//
		return content;
		//
	}
	//
}
//
function isMobileNumber(number) {
	// Remove quaisquer caracteres não numéricos para garantir que estamos trabalhando apenas com dígitos
	const numeroLimpo = number.replace(/[^0-9]/g, '');

	// Verifica o comprimento do número para determinar a posição correta do dígito a ser verificado
	if (numeroLimpo.length === 12) {
		// Número com código do país, verifica o 5º dígito
		return numeroLimpo.charAt(4) === '9';
	} else if (numeroLimpo.length === 10) {
		// Número sem código do país, verifica o 3º dígito
		return numeroLimpo.charAt(2) === '9';
	} else {
		// Se o número não tem 10 ou 12 dígitos, não atende aos critérios esperados
		return false;
	}
}
//
/*
function formatTelefone(numero) {
	// Remove caracteres especiais
	let numeroLimpo = numero.replace(/[^0-9]/g, '');
	var correctNumber = null;
	if (isMobileNumber(numeroLimpo)) {
		// Verifica se já possui o código do país, se não, adiciona
		if (numeroLimpo.substring(0, 2) !== "55") {
			numeroLimpo = "55" + numeroLimpo;
		}
		// Formata baseado na quantidade de dígitos (assumindo já com o '55')
		if (numeroLimpo.length >= 13) {
			// Celular
			correctNumber = '+' + numeroLimpo.substring(0, 2) + ' (' + numeroLimpo.substring(2, 4) + ') ' + numeroLimpo.substring(4, 8) + '-' + numeroLimpo.substring(8);
		} else if (numeroLimpo.length <= 12) {
			// Celular com adição do 9º dígito
			correctNumber = '+' + numeroLimpo.substring(0, 2) + ' (' + numeroLimpo.substring(2, 4) + ') 9' + numeroLimpo.substring(4, 8) + '-' + numeroLimpo.substring(8);
		} else {
			// Retorna o número sem formatação se não atender aos critérios acima
			correctNumber = numero;
		}
	} else {
		// Verifica se já possui o código do país, se não, adiciona
		if (numeroLimpo.substring(0, 2) !== "55") {
			numeroLimpo = "55" + numeroLimpo;
		}
		// Fixo
		correctNumber = '+' + numeroLimpo.substring(0, 2) + ' (' + numeroLimpo.substring(2, 4) + ') ' + numeroLimpo.substring(4, 8) + '-' + numeroLimpo.substring(8);
	}
	return correctNumber;
}
*/
//
function formatTelefone(numero) {
	// Remove caracteres especiais
	let numeroLimpo = numero.replace(/[^0-9]/g, '');
	var correctNumber = null;

	// Verifica se o número é brasileiro (com ou sem o código do país "55")
	let isBrazilian = numeroLimpo.length === 10 || (numeroLimpo.length === 11 && numeroLimpo.charAt(2) === '9') || numeroLimpo.length === 12 || numeroLimpo.length === 13;
	if (isBrazilian) {
		if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
			// Adiciona o código do país "55" se não estiver presente
			numeroLimpo = "55" + numeroLimpo;
		}

		// Formatação de números brasileiros
		if (numeroLimpo.length === 12) {
			// Fixo
			correctNumber = '+' + numeroLimpo.substring(0, 2) + ' (' + numeroLimpo.substring(2, 4) + ') ' + numeroLimpo.substring(4, 8) + '-' + numeroLimpo.substring(8);
		} else if (numeroLimpo.length === 13) {
			// Celular
			correctNumber = '+' + numeroLimpo.substring(0, 2) + ' (' + numeroLimpo.substring(2, 4) + ') ' + numeroLimpo.substring(4, 5) + ' ' + numeroLimpo.substring(5, 9) + '-' + numeroLimpo.substring(9);
		}
	} else {
		// Formatação de números estrangeiros
		correctNumber = '+' + numeroLimpo;
	}

	return correctNumber;
}
//
async function losApi(socketio, data, result) {
	//
	const funcoesSocket = new fnSocket(socketio);
	//
	let combinedObject = { "data": data, "result": result };
	funcoesSocket.logs(combinedObject);
	//
}
//
async function losApiSend(socketio, data, result) {
	//
	const funcoesSocket = new fnSocket(socketio);
	//
	let combinedObject = { "data": data, "result": result };
	funcoesSocket.messagesent(combinedObject);
	//
}
//
async function autoStart(req) {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const row = await Tokens.findOne({
		limit: 1,
		attributes: ['webhook_cli', 'wh_status', 'wh_message', 'wh_qrcode', 'wh_connect'],
		where: {
			token: SessionName
		}
	}).then(async (entries) => {
		return entries;
	}).catch(async (err) => {
		console.log(`- Error: ${err}`);
		return false;
	}).finally(async () => {
		//Tokens.release();
	});
	//
	var webhook_cli = null;
	var wh_status = false;
	var wh_message = false;
	var wh_qrcode = false;
	var wh_connect = false;
	//
	if (row) {
		//
		//console.log(JSON.stringify(row, undefined, 2));
		//
		webhook_cli = row.webhook_cli;
		wh_status = Boolean(row.wh_status);
		wh_message = Boolean(row.wh_message);
		wh_qrcode = Boolean(row.wh_qrcode);
		wh_connect = Boolean(row.wh_connect);
		//
	}
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/instance/init`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: `{
			"key": "${SessionName}",
		"browser": "ConnectZap - API",
		"webhook": true,
		"base64": true,
			"webhookUrl": "${webhook_cli}",
			"webhookEvents": [
					"connection.update",
					"qrCode.update",
					"presence.update",
					"contacts.upsert",
					"chats.upsert",
					"chats.delete",
					"messages.update",
					"messages.upsert",
					"messages.send",
					"call.events",
					"groups.upsert",
					"groups.update",
					"group-participants.update"
			],
			"ignoreGroups": false,
			"messagesRead": false
	}`
	}).then(async (response) => {
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
	}).catch(async (error) => {
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		console.log(responseError);
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
	});
	//
	//
}
//
/*
╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
*/
//
router.post('/Status', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	await axios({
		method: 'GET',
		maxBodyLength: Infinity,
		url: `${apiUrl}/instance/info?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: {}
	}).then(async (response) => {
		//
		let url = response?.config?.url;
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		const stateError = responseData?.error;
		var result = {};
		if (stateError) {
			//
			result = {
				state: "DISCONNECTED",
				status: "notLogged",
				message: "Dispositivo desconectado"
			};
			//
		} else {
			const stateConnection = responseData?.instance_data?.phone_connected;
			switch (stateConnection) {
				case true:
					//
					result = {
						state: "CONNECTED",
						status: "inChat",
						message: "Sistema iniciado e disponivel para uso"
					};
					//
					break;
				case false:
					//
					result = {
						state: "DISCONNECTED",
						status: "notLogged",
						message: "Dispositivo desconectado"
					};
					//
					break;
				default:
					//
					result = {
						state: "STARTING",
						status: "notLogged",
						message: "Sistema iniciando e indisponivel para uso"
					};
				//
			}
			//
		}
		//
		let objectReq = {
			"request": `${apiUrlBase}`,
			"responseData": result,
			"statusCode": `${statusCode}`,
			'statusText': `${statusText}`
		}
		//
		await losApi(req.io, requestBody, objectReq);
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		let response = error?.response;
		let url = error?.response?.config?.url;
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status || 401;
		let statusText = error?.response?.statusText;
		let errorMessage = error?.message;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			//let resContent = await checkContent(responseError?.response?.message, SessionName);
			//if (resContent) { responseError.response.message = resContent.message }
			//
			let result = {
				"erro": true,
				"statusCode": responseError?.status,
				"state": "DISCONNECTED",
				"status": "notLogged",
				"message": responseError?.response?.message
			};
			//
			let objectReq = {
				"request": `${apiUrlBase}`,
				"responseData": result,
				"statusCode": `${statusCode}`,
				'statusText': `${statusText}`,
				'errorMessage': `${errorMessage}`
			}
			//
			await losApi(req.io, requestBody, objectReq);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": result
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			let result = {
				"erro": true,
				"statusCode": 400,
				"state": "DISCONNECTED",
				"status": "notLogged",
				"message": "Não foi possível verificar o status"
			};
			//
			let objectReq = {
				"request": `${apiUrlBase}`,
				"responseData": result,
				"statusCode": `${statusCode}`,
				'statusText': `${statusText}`,
				'errorMessage': `${errorMessage}`
			}
			//
			await losApi(req.io, requestBody, objectReq);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(result?.statusCode).json({
				"Status": result
			});
			//
		}
		//
	});
	//
});
//
//
router.post('/Start', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined || req?.body?.webhook == undefined) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	//await sequelize.authenticate();
	const row = await Tokens.findOne({
		limit: 1,
		attributes: ['webhook_cli', 'wh_status', 'wh_message', 'wh_qrcode', 'wh_connect'],
		where: {
			token: SessionName
		}
	}).then(async (entries) => {
		return entries;
	}).catch(async (err) => {
		console.log(`- Error: ${err}`);
		return false;
	}).finally(async () => {
		//Tokens.release();
	});
	//
	var webhook_cli = null;
	var wh_status = false;
	var wh_message = false;
	var wh_qrcode = false;
	var wh_connect = false;
	//
	if (row) {
		//
		//console.log(JSON.stringify(row, undefined, 2));
		//
		webhook_cli = row.webhook_cli;
		wh_status = Boolean(row.wh_status);
		wh_message = Boolean(row.wh_message);
		wh_qrcode = Boolean(row.wh_qrcode);
		wh_connect = Boolean(row.wh_connect);
		//
	}
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/instance/init?admintoken=AnZ0Ie0IcvjPAaEGeTw4SpTMMLlhyOr0K1aLcORWR0zwU6nGp`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: `{
			"key": "${SessionName}",
		"browser": "ConnectZap - API",
		"webhook": true,
		"base64": true,
			"webhookUrl": "${webhook_cli}",
			"webhookEvents": [
					"connection.update",
					"qrCode.update",
					"presence.update",
					"contacts.upsert",
					"chats.upsert",
					"chats.delete",
					"messages.update",
					"messages.upsert",
					"messages.send",
					"call.events",
					"groups.upsert",
					"groups.update",
					"group-participants.update"
			],
			"ignoreGroups": false,
			"messagesRead": false
	}`
	}).then(async (response) => {
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		result = {
			state: "STARTING",
			status: "notLogged",
			message: "Sistema iniciando e indisponivel para uso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		console.log(responseError);
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			//let resContent = await checkContent(responseError?.response?.message, SessionName);
			//if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível iniciar a sessão"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/Logout', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	await axios({
		method: 'GET',
		maxBodyLength: Infinity,
		url: `${apiUrl}/instance/logout?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: {}
	}).then(async (response) => {
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Sessão desconetada com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			//let resContent = await checkContent(responseError?.response?.message, SessionName);
			//if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível fazer logout"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/restartToken', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	await axios({
		method: 'GET',
		maxBodyLength: Infinity,
		url: `${apiUrl}/instance/delete?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: {}
	}).then(async (response) => {
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Sessão reiniciada com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			//let resContent = await checkContent(responseError?.response?.message, SessionName);
			//if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível reiniciar a sessão"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/QRCode', verifyToken.verify, async (req, res, next) => {
	//
	await autoStart(req);
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined || req?.body?.View == undefined) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	await axios({
		method: 'GET',
		maxBodyLength: Infinity,
		url: `${apiUrl}/instance/qrbase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: {}
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		if (responseData?.error === true) {
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(200).json({
				"Status": {
					"erro": false,
					"statusCode": 200,
					"state": "CONNECTED",
					"status": "isChat",
					"message": responseData?.message
				}
				//
			});
		}
		//
		if (req?.body?.View === true) {
			//
			let qrcode = responseData?.qrcode;
			const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,', ''), 'base64');
			//
			logger?.info('- Redirect Success');
			// response.body, response.headers, response.status
			//
			logger?.info(`- Success: status ${response?.status}, statusCode ${response?.statusCode}`);
			//
			logger?.info('=====================================================================================================');
			//
			res.writeHead(200, {
				'Content-Type': 'image/png',
				'Content-Length': imageBuffer.length
			});
			//
			res.status(200);
			res.end(imageBuffer);
			//
		} else {
			//
			var resultRes = {
				"erro": false,
				"status_code": 200,
				"state": "QRCODE",
				"status": "qrRead",
				"qrcode": responseData?.qrcode,
				"message": "Aguardando leitura do QR-Code"
			};
			//res.setHeader('Content-Type', 'application/json');
			res.status(resultRes.status_code).json({
				"Status": resultRes
			});
			//
		}
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			//let resContent = await checkContent(responseError?.response?.message, SessionName);
			//if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível verificar o status"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/getCode', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined || req?.body?.phonefull == undefined) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	/*
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/instance/getcode?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: {
			"webhook": requestBody?.webhook || true,
			"number": formatTelefone(requestBody?.phonefull).replace(/\D/g, "")
		}
	}).then(async (response) => {
	*/
	//
	let data = JSON.stringify({
		"number": formatTelefone(requestBody?.phonefull).replace(/\D/g, "")
	});
	//
	const configAxios = {
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/instance/getcode?key=${SessionName}`,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	};
	//
	await axios.request(configAxios).then(async (response) => {
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		if (responseData?.error) {
			var resultRes = {
				"erro": responseData?.error,
				"status_code": 200,
				"code": null,
				"message": responseData?.message,
			};
		} else {
			var resultRes = {
				"erro": false,
				"status_code": 200,
				"state": "DISCONNECTED",
				"status": "notLogged",
				"code": responseData?.code,
				"message": "Aguardando leitura do codigo"
			};
		}
		//res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status_code).json({
			"Status": resultRes
		});
		//
	}).catch(async (error) => {
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			//let resContent = await checkContent(responseError?.response?.message, SessionName);
			//if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível verificar o status"
				}
			});
		}
		//
	});
	//
});
//
router.post('/Maturador', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined || req?.body?.token_1 == undefined || req?.body?.numero_1 == undefined || req?.body?.token_2 == undefined || req?.body?.numero_2 == undefined || req?.body?.delay_mensagens == undefined || req?.body?.delay_respostas == undefined) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	if (config.URL_MATURATION) {
		await axios({
			method: 'POST',
			maxBodyLength: Infinity,
			url: `${config.URL_MATURATION}`,
			httpsAgent: agent,
			headers: {
				'Content-Type': 'application/json'
			},
			data: requestBody
		}).then(async (response) => {
			//
			let responseData = response?.data;
			let statusCode = response?.status;
			let statusText = response?.statusText;
			//
			logger?.info('- Redirect Success');
			// response.body, response.headers, response.status
			//
			logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
			//
			logger?.info('=====================================================================================================');
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(200).json(responseData);
			//
		}).catch(async (error) => {
			//
			let responseError = error?.response?.data;
			let statusCode = error?.response?.status;
			let statusText = error?.response?.statusText;
			//
			//console.log(JSON.stringify(responseError, undefined, 2));
			//
			logger?.error(`- Redirect Error`);
			//
			//
			logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
			//
			logger?.info('=====================================================================================================');
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json(responseError);
			//
		});
	} else {
		//
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Não foi possivel executar a ação, verifique a url informada.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
});
//
/*
╔╗ ┌─┐┌─┐┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐  ┬ ┬┌─┐┌─┐┌─┐┌─┐
╠╩╗├─┤└─┐││    ╠╣ │ │││││   │ ││ ││││└─┐  │ │└─┐├─┤│ ┬├┤ 
╚═╝┴ ┴└─┘┴└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘  └─┘└─┘┴ ┴└─┘└─┘
*/
//
router.post('/sendContactVcard', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (
		req?.body == undefined ||
		req?.body?.SessionName == undefined ||
		req?.body?.phonefull == undefined ||
		req?.body?.namecontact == undefined ||
		req?.body?.organization == undefined ||
		req?.body?.contact == undefined
	) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
		+ 'VERSION:3.0\n'
		+ 'FN:' + requestBody.namecontact + '\n' // full name
		+ 'ORG:' + requestBody.organization + ';\n' // the organization of the contact
		+ 'TEL;type=CELL;type=VOICE;waid=' + requestBody?.contact.replace(/\D/g, "") + ':' + requestBody.contact + '\n' // WhatsApp ID + phone number
		+ 'END:VCARD';
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/contact?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
			"vcard": {
				"fullName": requestBody?.namecontact,
				"displayName": requestBody?.namecontact,
				"organization": requestBody?.organization ? requestBody?.organization : requestBody?.namecontact,
				"phoneNumber": requestBody?.contact.replace(/\D/g, "")
			}
		}
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendVoiceBase64', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (
		req?.body == undefined ||
		req?.body?.SessionName == undefined ||
		req?.body?.phonefull == undefined ||
		req?.body?.base64 == undefined ||
		req?.body?.originalname == undefined
	) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "audio") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo de audio'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	// https://devocional.connectzap.com.br/uploads/AUD20240311.mp3
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"type": "audio",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2))
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendVoiceFromBase64', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (
		req?.body == undefined ||
		req?.body?.SessionName == undefined ||
		req?.body?.phonefull == undefined ||
		req?.body?.base64 == undefined ||
		req?.body?.mimetype == undefined ||
		req?.body?.originalname == undefined
	) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "audio") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo de audio'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	// https://devocional.connectzap.com.br/uploads/AUD20240311.mp3
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"type": "audio",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"mimetype": requestBody?.mimetype,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendText', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	if (
		req?.body == undefined ||
		req?.body?.SessionName == undefined ||
		req?.body?.phonefull == undefined ||
		req?.body?.msg == undefined
	) {
		var resultRes = {
			"erro": true,
			"status": 404,
			"message": 'Todos os valores deverem ser preenchidos, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
	const contemNovamsg = requestBody?.msg.includes("[NOVAMSG]") ?? false;

	if (contemNovamsg) {
		//
		var setSend = [];
		var indice = 1;
		var indiceError = 0;
		const array = requestBody?.msg.split("[NOVAMSG]");
		for (const body of array) {
			//
			await axios({
				method: 'POST',
				maxBodyLength: Infinity,
				url: `${apiUrl}/message/text?key=${SessionName}`,
				httpsAgent: agent,
				headers: {
					'Content-Type': 'application/json'
				},
				data: {
					"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
					"typeId": "user",
					"message": body,
					"options": {
						"delay": 2,
						"replyFrom": ""
					}
				}
			}).then(async (response) => {
				//
				let monitor = await contentMonitor('success', SessionName);
				//
				let responseData = response?.data;
				let statusCode = response?.status;
				let statusText = response?.statusText;
				//
				logger?.info('- Redirect Success');
				// response.body, response.headers, response.status
				//
				logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
				//
				logger?.info('=====================================================================================================');
				//
				let resultRes = {
					"erro": false,
					"status": 200,
					"message": "Mensagem enviada com sucesso."
				};
				//
				setSend.push({ ...resultRes, countMsg: indice });
				indice++;
				//
			}).catch(async (error) => {
				//
				await contentMonitor(null, SessionName);
				//
				//console.log(error);
				let responseError = error?.response?.data;
				let statusCode = error?.response?.status;
				let statusText = error?.response?.statusText;
				//
				//console.log(JSON.stringify(responseError, undefined, 2));
				//
				logger?.error(`- Redirect Error`);
				//
				logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
				//
				logger?.info('=====================================================================================================');
				//
				let resultRes = {
					"erro": true,
					"status": 404,
					"message": "Erro ao enviar menssagem"
				};
				//
				setSend.push({ ...resultRes, countMsg: indice });
				indice++;
				indiceError++;
				//
			});
		};
		//
		if (indiceError >= 1) { await validateOffLine.verify(SessionName); }
		//
		return res.status(201).json({
			"Status": setSend
		});
		//
	} else {
		//
		await axios({
			method: 'POST',
			maxBodyLength: Infinity,
			url: `${apiUrl}/message/text?key=${SessionName}`,
			httpsAgent: agent,
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
				"typeId": "user",
				"message": requestBody?.msg,
				"options": {
					"delay": 2,
					"replyFrom": ""
				}
			}
		}).then(async (response) => {
			//
			let monitor = await contentMonitor('success', SessionName);
			//
			let responseData = response?.data;
			let statusCode = response?.status;
			let statusText = response?.statusText;
			//
			logger?.info('- Redirect Success');
			// response.body, response.headers, response.status
			//
			logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
			//
			logger?.info('=====================================================================================================');
			//
			let result = {
				"erro": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(result.status).json({
				"Status": result
			});
			//
		}).catch(async (error) => {
			//
			await contentMonitor(null, SessionName);
			//
			//console.log(error);
			let responseError = error?.response?.data;
			let statusCode = error?.response?.status;
			let statusText = error?.response?.statusText;
			//
			//console.log(JSON.stringify(responseError, undefined, 2));
			//
			logger?.error(`- Redirect Error`);
			//
			logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
			//
			logger?.info('=====================================================================================================');
			//
			//console.log(JSON.stringify(responseError, undefined, 2));
			//
			if (responseError?.error && responseError?.message) {
				//
				let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
				if (resContent) { responseError.message = resContent.message }
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(statusCode).json({
					"Status": {
						"erro": true,
						"statusCode": statusCode,
						"message": responseError?.message
					}
				});
				//
			} else {
				//
				await validateOffLine.verify(SessionName);
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(400).json({
					"Status": {
						"erro": true,
						"statusCode": 400,
						"state": "DISCONNECTED",
						"status": "notLogged",
						"message": "Não foi possível enviar sua mensagem"
					}
				});
			}
			//
		});
		//
	}
	//
});
//
//
router.post('/sendTextMult', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const arrayNumber = requestBody?.phonefull;
	const contemNovamsg = requestBody?.msg.includes("[NOVAMSG]") ?? false;
	var setSend = [];
	var indice = 1;
	var indiceError = 0;
	for (const number of arrayNumber) {
		if (contemNovamsg) {
			//
			const array = requestBody?.msg.split("[NOVAMSG]");
			for (const body of array) {
				//
				await axios({
					method: 'POST',
					maxBodyLength: Infinity,
					url: `${apiUrl}/message/text?key=${SessionName}`,
					httpsAgent: agent,
					headers: {
						'Content-Type': 'application/json'
					},
					data: {
						"id": formatTelefone(number).replace(/\D/g, ""),
						"typeId": "user",
						"message": body,
						"options": {
							"delay": 2,
							"replyFrom": ""
						},
						"groupOptions": {
							"markUser": "ghostMention"
						}
					}
				}).then(async (response) => {
					//
					let monitor = await contentMonitor('success', SessionName);
					//
					let responseData = response?.data;
					let statusCode = response?.status;
					let statusText = response?.statusText;
					//
					logger?.info('- Redirect Success');
					// response.body, response.headers, response.status
					//
					logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
					//
					logger?.info('=====================================================================================================');
					//
					let resultRes = {
						"erro": false,
						"status": 200,
						"message": "Mensagem enviada com sucesso."
					};
					//
					setSend.push({ ...resultRes, countMsg: indice });
					indice++;
					//
				}).catch(async (error) => {
					//
					await contentMonitor(null, SessionName);
					//
					//console.log(error);
					let responseError = error?.response?.data;
					let statusCode = error?.response?.status;
					let statusText = error?.response?.statusText;
					//
					//console.log(JSON.stringify(responseError, undefined, 2));
					//
					logger?.error(`- Redirect Error`);
					//
					logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
					//
					logger?.info('=====================================================================================================');
					//
					let resultRes = {
						"erro": true,
						"status": 404,
						"fromNumber": formatTelefone(number).replace(/\D/g, ""),
						"message": "Erro ao enviar menssagem"
					};
					//
					setSend.push({ ...resultRes, countMsg: indice });
					indice++;
					//
				});
			};
			//
		} else {
			//
			await axios({
				method: 'POST',
				maxBodyLength: Infinity,
				url: `${apiUrl}/message/text?key=${SessionName}`,
				httpsAgent: agent,
				headers: {
					'Content-Type': 'application/json'
				},
				data: {
					"id": formatTelefone(number).replace(/\D/g, ""),
					"typeId": "user",
					"message": requestBody?.msg,
					"options": {
						"delay": 2,
						"replyFrom": ""
					}
				}
			}).then(async (response) => {
				//
				let monitor = await contentMonitor('success', SessionName);
				//
				let responseData = response?.data;
				let statusCode = response?.status;
				let statusText = response?.statusText;
				//
				logger?.info('- Redirect Success');
				// response.body, response.headers, response.status
				//
				logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
				//
				logger?.info('=====================================================================================================');
				//
				let resultRes = {
					"erro": false,
					"status": 200,
					"fromNumber": formatTelefone(number).replace(/\D/g, ""),
					"message": "Mensagem enviada com sucesso."
				};
				//
				setSend.push({ ...resultRes, countMsg: indice });
				indice++;
				//
			}).catch(async (error) => {
				//
				await contentMonitor(null, SessionName);
				//
				//console.log(error);
				let responseError = error?.response?.data;
				let statusCode = error?.response?.status;
				let statusText = error?.response?.statusText;
				//
				//console.log(JSON.stringify(responseError, undefined, 2));
				//
				logger?.error(`- Redirect Error`);
				//
				logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
				//
				logger?.info('=====================================================================================================');
				//
				//console.log(JSON.stringify(responseError, undefined, 2));
				//
				if (responseError?.error && responseError?.message) {
					//
					let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(number).replace(/\D/g, ""));
					if (resContent) { responseError.message = resContent.message }
					//
					let resultRes = {
						"erro": true,
						"statusCode": statusCode,
						"fromNumber": formatTelefone(number).replace(/\D/g, ""),
						"message": responseError?.message
					};
					//
					setSend.push({ ...resultRes, countMsg: indice });
					indice++;
					//
				} else {
					//
					await validateOffLine.verify(SessionName);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(400).json({
						"Status": {
							"erro": true,
							"statusCode": 400,
							"state": "DISCONNECTED",
							"status": "notLogged",
							"message": "Não foi possível enviar sua mensagem"
						}
					});
				}
				//
			});
			//
		}
	}
	//
	return res.status(201).json({
		"Status": setSend
	});
	//
});
//
//
router.post('/sendTextMassa', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	//
	try {
		//
		//await sequelize.authenticate();
		const row = await TokenAsName.findAll({
			attributes: ['token', 'usercon'],
			where: {
				email: req?.body?.email,
				state: 'CONNECTED',
				sendmass: 'true',
			},
			order: Sequelize.literal('rand()'),
			limit: 1,
		}).then(async (entries) => {
			return entries;
		}).catch(async (err) => {
			logger?.error(`- Error: ${err}`);
			return false;
		});
		//await sequelize.close();
		//
		if (row?.length) {
			//
			await row.forEach(async (item) => {
				let token = item.token;
				let usercon = item.usercon;
				//
				await axios({
					method: 'POST',
					maxBodyLength: Infinity,
					url: `${apiUrl}/message/text?key=${token}`,
					httpsAgent: agent,
					headers: {
						'Content-Type': 'application/json'
					},
					data: {
						"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
						"typeId": "user",
						"message": requestBody?.msg,
						"options": {
							"delay": 2,
							"replyFrom": ""
						},
						"groupOptions": {
							"markUser": "ghostMention"
						}
					}
				}).then(async (response) => {
					//
					let monitor = await contentMonitor('success', SessionName);
					//
					let responseData = response?.data;
					let statusCode = response?.status;
					let statusText = response?.statusText;
					//
					logger?.info('- Redirect Success');
					// response.body, response.headers, response.status
					//
					logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
					//
					logger?.info('=====================================================================================================');
					//
					let result = {
						"erro": false,
						"status": 200,
						"userFrom": usercon,
						"message": "Mensagem enviada com sucesso."
					};
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(result.status).json({
						"Status": result
					});
					//
					//
				}).catch(async (error) => {
					//
					await contentMonitor(null, SessionName);
					//
					//console.log(error);
					let responseError = error?.response?.data;
					let statusCode = error?.response?.status;
					let statusText = error?.response?.statusText;
					//
					//
					//console.log(JSON.stringify(responseError, undefined, 2));
					//
					logger?.error(`- Redirect Error`);
					//
					//
					logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
					//
					logger?.info('=====================================================================================================');
					//
					//
					if (responseError?.response && responseError?.response?.message) {
						//
						let resContent = await checkContent(responseError?.response?.message, SessionName);
						if (resContent) { responseError.response.message = resContent.message }
						//
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(responseError?.status).json({
							"Status": {
								"erro": true,
								"statusCode": responseError?.status,
								"message": responseError?.response?.message
							}
						});
						//
					} else {
						//
						//await validateOffLine.verify(SessionName);
						//
						res.setHeader('Content-Type', 'application/json');
						return res.status(400).json({
							"Status": {
								"erro": true,
								"statusCode": 400,
								"state": "DISCONNECTED",
								"status": "notLogged",
								"message": "Não foi possível verificar o status"
							}
						});
					}
					//
				});
				//
			});
			//
		} else {
			//
			var validate = {
				"erro": true,
				"status": 400,
				"message": "Cadastro não encontrado, verifique e tente novamente.'"
			};
			//res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		}
	} catch (err) {
		logger?.error(`- Erro: ${err}`);
		//
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		//res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
});
//
//
router.post('/sendLocation', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	//
	const data = {
		"number": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"options": {
			"delay": 1200,
			"presence": "composing"
		},
		"locationMessage": {
			"name": requestBody?.local,
			"address": requestBody?.local,
			"latitude": ensureInteger(requestBody.lat),
			"longitude": ensureInteger(requestBody.long)
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendLocation/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2))
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendImageUrl', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"type": "image",
		"url": requestBody?.url,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}

	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendurlfile?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2))
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendImageBase64', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "image") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo image'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"type": "image",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendImageFromBase64', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "image") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo image'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"type": "image",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"mimetype": requestBody?.mimetype,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendFileUrl', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"type": "document",
		"url": requestBody?.url,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}

	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendurlfile?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2))
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendFileBase64', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"type": "document",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendFileBase64Massa', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	//
	try {
		//
		//await sequelize.authenticate();
		const row = await TokenAsName.findAll({
			attributes: ['token', 'usercon'],
			where: {
				email: req?.body?.email,
				state: 'CONNECTED',
				sendmass: 'true',
			},
			order: Sequelize.literal('rand()'),
			limit: 1,
		}).then(async (entries) => {
			return entries;
		}).catch(async (err) => {
			logger?.error(`- Error: ${err}`);
			return false;
		});
		//await sequelize.close();
		//
		if (row?.length) {
			//
			await row.forEach(async (item) => {
				let token = item.token;
				let usercon = item.usercon;
				//
				const data = {
					"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
					"typeId": "user",
					"type": "document",
					"base64": requestBody?.base64,
					"originalname": requestBody?.originalname,
					"options": {
						"caption": requestBody?.caption,
						"replyFrom": "",
						"delay": 2
					}
				};
				//
				await axios({
					method: 'POST',
					maxBodyLength: Infinity,
					url: `${apiUrl}/message/sendfilebase64?key=${token}`,
					httpsAgent: agent,
					headers: {
						'Content-Type': 'application/json'
					},
					data: data
				}).then(async (response) => {
					//
					let monitor = await contentMonitor('success', SessionName);
					//
					let responseData = response?.data;
					let statusCode = response?.status;
					let statusText = response?.statusText;
					//
					logger?.info('- Redirect Success');
					// response.body, response.headers, response.status
					//
					logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
					//
					logger?.info('=====================================================================================================');
					//
					let result = {
						"erro": false,
						"status": 200,
						"userFrom": usercon,
						"message": "Mensagem enviada com sucesso."
					};
					//
					res.setHeader('Content-Type', 'application/json');
					res.status(result.status).json({
						"Status": result
					});
					//
					//
				}).catch(async (error) => {
					//
					await contentMonitor(null, SessionName);
					//
					//console.log(error);
					let responseError = error?.response?.data;
					let statusCode = error?.response?.status;
					let statusText = error?.response?.statusText;
					//
					//
					//console.log(JSON.stringify(responseError, undefined, 2));
					//
					logger?.error(`- Redirect Error`);
					//
					//
					logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
					//
					logger?.info('=====================================================================================================');
					//
					//await validateOffLine.verify(SessionName);
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(400).json({
						"Status": {
							"erro": true,
							"status": 404,
							"userFrom": usercon,
							"message": "Erro ao enviar menssagem"
						}
					});
					//
				});
			});
			//
		} else {
			//
			var validate = {
				"erro": true,
				"status": 400,
				"message": "Cadastro não encontrado, verifique e tente novamente.'"
			};
			//res.setHeader('Content-Type', 'application/json');
			res.status(validate.status).json({
				"Status": validate
			});
			//
		}
	} catch (err) {
		logger?.error(`- Erro: ${err}`);
		//
		var resultRes = {
			"erro": true,
			"status": 403,
			"message": 'Não foi possivel executar a ação, verifique e tente novamente.'
		};
		//
		//res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
});
//
//
router.post('/sendFileFromBase64', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"type": "document",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"mimetype": requestBody?.mimetype,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendStickersUrl', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"type": "image",
		"url": requestBody?.url,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}

	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendurlfile?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2))
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendStickersBase64', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "image") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo image'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	// https://devocional.connectzap.com.br/uploads/AUD20240311.mp3
	const data = {
		"SessionName": requestBody?.SessionName,
		"phonefull": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"base64": requestBody?.base64,
		"caption": requestBody?.caption,
		"originalname": requestBody?.originalname
	}
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `http://127.0.0.1:3003/api/base64`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendStickersFromBase64', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "image") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo image'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	// https://devocional.connectzap.com.br/uploads/AUD20240311.mp3
	const data = {
		"SessionName": requestBody?.SessionName,
		"phonefull": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"base64": requestBody?.base64,
		"caption": requestBody?.caption,
		"originalname": requestBody?.originalname
	}
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `http://127.0.0.1:3003/api/base64`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendPoll', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"number": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"options": {
			"delay": 1200,
			"presence": "composing"
		},
		"pollMessage": {
			"name": requestBody?.name,
			"selectableCount": requestBody?.selectableCount,
			"values": requestBody?.values
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendPoll/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendList', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"type": "user",
		"options": {
			"delay": 0,
			"replyFrom": ""
		},
		"groupOptions": {
			"markUser": "ghostMention"
		},
		"msgdata": requestBody?.listMessage
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/list?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendButton', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"type": "user",
		"options": {
			"delay": 0,
			"replyFrom": ""
		},
		"groupOptions": {
			"markUser": "ghostMention"
		},
		"btndata": requestBody?.btnMessage
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/button?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
/*
╔═╗┬─┐┌─┐┬ ┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐               
║ ╦├┬┘│ ││ │├─┘  ╠╣ │ │││││   │ ││ ││││└─┐               
╚═╝┴└─└─┘└─┘┴    ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘               
*/
//
router.post('/sendContactVcardGrupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
		+ 'VERSION:3.0\n'
		+ 'FN:' + requestBody.namecontact + '\n' // full name
		+ 'ORG:' + requestBody.organization + ';\n' // the organization of the contact
		+ 'TEL;type=CELL;type=VOICE;waid=' + requestBody?.contact.replace(/\D/g, "") + ':' + requestBody.contact + '\n' // WhatsApp ID + phone number
		+ 'END:VCARD';
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/contact?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			"id": requestBody?.groupId + '@g.us',
			"vcard": {
				"fullName": requestBody?.namecontact,
				"displayName": requestBody?.namecontact,
				"organization": requestBody?.organization ? requestBody?.organization : requestBody?.namecontact,
				"phoneNumber": requestBody?.contact.replace(/\D/g, "")
			}
		}
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendVoiceBase64Grupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "audio") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo de audio'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	const data = {
		"id": requestBody?.groupId + '@g.us',
		"typeId": "group",
		"type": "audio",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2))
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendVoiceFromBase64Grupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "audio") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo de audio'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	const data = {
		"id": requestBody?.groupId + '@g.us',
		"typeId": "group",
		"type": "audio",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"mimetype": requestBody?.mimetype,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		logger?.error(`- Redirect Error`);
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendTextGrupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const contemNovamsg = requestBody?.msg.includes("[NOVAMSG]") ?? false;

	if (contemNovamsg) {
		//
		var setSend = [];
		var indice = 1;
		var indiceError = 0;
		const array = requestBody?.msg.split("[NOVAMSG]");
		for (const body of array) {
			//
			await axios({
				method: 'POST',
				maxBodyLength: Infinity,
				url: `${apiUrl}/message/text?key=${SessionName}`,
				httpsAgent: agent,
				headers: {
					'Content-Type': 'application/json'
				},
				data: {
					"id": requestBody?.groupId + '@g.us',
					"typeId": "group",
					"message": body,
					"options": {
						"delay": 2,
						"replyFrom": ""
					}
				}
			}).then(async (response) => {
				//
				let monitor = await contentMonitor('success', SessionName);
				//
				let responseData = response?.data;
				let statusCode = response?.status;
				let statusText = response?.statusText;
				//
				logger?.info('- Redirect Success');
				// response.body, response.headers, response.status
				//
				logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
				//
				logger?.info('=====================================================================================================');
				//
				let resultRes = {
					"erro": false,
					"status": 200,
					"message": "Mensagem enviada com sucesso."
				};
				//
				setSend.push({ ...resultRes, countMsg: indice });
				indice++;
				//
			}).catch(async (error) => {
				//
				await contentMonitor(null, SessionName);
				//
				//console.log(error);
				let responseError = error?.response?.data;
				let statusCode = error?.response?.status;
				let statusText = error?.response?.statusText;
				//
				//console.log(JSON.stringify(responseError, undefined, 2));
				//
				logger?.error(`- Redirect Error`);
				//
				logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
				//
				logger?.info('=====================================================================================================');
				//
				let resultRes = {
					"erro": true,
					"status": 404,
					"message": "Erro ao enviar menssagem"
				};
				//
				setSend.push({ ...resultRes, countMsg: indice });
				indice++;
				indiceError++;
				//
			});
		};
		//
		if (indiceError >= 1) { await validateOffLine.verify(SessionName); }
		//
		return res.status(201).json({
			"Status": setSend
		});
		//
	} else {
		//
		await axios({
			method: 'POST',
			maxBodyLength: Infinity,
			url: `${apiUrl}/message/text?key=${SessionName}`,
			httpsAgent: agent,
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				"id": requestBody?.groupId + '@g.us',
				"typeId": "group",
				"message": requestBody?.msg,
				"options": {
					"delay": 2,
					"replyFrom": ""
				}
			}
		}).then(async (response) => {
			//
			let monitor = await contentMonitor('success', SessionName);
			//
			let responseData = response?.data;
			let statusCode = response?.status;
			let statusText = response?.statusText;
			//
			logger?.info('- Redirect Success');
			// response.body, response.headers, response.status
			//
			logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
			//
			logger?.info('=====================================================================================================');
			//
			let result = {
				"erro": false,
				"status": 200,
				"message": "Mensagem enviada com sucesso."
			};
			//
			res.setHeader('Content-Type', 'application/json');
			res.status(result.status).json({
				"Status": result
			});
			//
		}).catch(async (error) => {
			//
			await contentMonitor(null, SessionName);
			//
			//console.log(error);
			let responseError = error?.response?.data;
			let statusCode = error?.response?.status;
			let statusText = error?.response?.statusText;
			//
			//console.log(JSON.stringify(responseError, undefined, 2));
			//
			logger?.error(`- Redirect Error`);
			//
			logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
			//
			logger?.info('=====================================================================================================');
			//
			//console.log(JSON.stringify(responseError, undefined, 2));
			//
			if (responseError?.error && responseError?.message) {
				//
				let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
				if (resContent) { responseError.message = resContent.message }
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(statusCode).json({
					"Status": {
						"erro": true,
						"statusCode": statusCode,
						"message": responseError?.message
					}
				});
				//
			} else {
				//
				await validateOffLine.verify(SessionName);
				//
				res.setHeader('Content-Type', 'application/json');
				return res.status(400).json({
					"Status": {
						"erro": true,
						"statusCode": 400,
						"state": "DISCONNECTED",
						"status": "notLogged",
						"message": "Não foi possível enviar sua mensagem"
					}
				});
			}
			//
		});
		//
	}
	//
});
//
//
router.post('/sendLocationGrupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	//
	const data = {
		"number": requestBody?.groupId + '@g.us',
		"options": {
			"delay": 1200,
			"presence": "composing"
		},
		"locationMessage": {
			"name": requestBody?.local,
			"address": requestBody?.local,
			"latitude": ensureInteger(requestBody.lat),
			"longitude": ensureInteger(requestBody.long)
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendLocation/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2))
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendImageUrlGrupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"typeId": "group",
		"type": "image",
		"url": requestBody?.url,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendurlfile?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2))
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendImageBase64Grupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "image") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo image'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	const data = {
		"id": requestBody?.groupId + '@g.us',
		"typeId": "group",
		"type": "image",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendImageFromBase64Grupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let type = mimeType.split("/")[0];
	//
	if (type !== "image") {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo image'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	// Verifica se a base64 é válida
	if (!isValidBase64(requestBody.base64)) {
		//
		var validate = {
			"error": true,
			"status": 400,
			"message": 'Base64 inválido'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	const data = {
		"id": requestBody?.groupId + '@g.us',
		"typeId": "group",
		"type": "image",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"mimetype": requestBody?.mimetype,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendFileUrlGrupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"typeId": "group",
		"type": "document",
		"url": requestBody?.url,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendurlfile?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2))
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendFileBase64Grupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + '@g.us',
		"typeId": "group",
		"type": "document",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendFileFromBase64Grupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + '@g.us',
		"typeId": "group",
		"type": "document",
		"base64": requestBody?.base64,
		"originalname": requestBody?.originalname,
		"mimetype": requestBody?.mimetype,
		"options": {
			"caption": requestBody?.caption,
			"replyFrom": "",
			"delay": 2
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendfilebase64?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendStickersUrlGrupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	//
	const data = {
		"number": requestBody?.groupId + '@g.us',
		"options": {
			"delay": 1200,
			"presence": "composing"
		},
		"stickerMessage": {
			"image": requestBody?.url
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendSticker/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		console.log(JSON.stringify(responseError, undefined, 2))
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendStickersBase64Grupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let mimeType = mime.lookup(requestBody.originalname);
	let ext = mime.extension(mimeType);
	let acceptedTypes = mimeType.split("/")[0];
	//
	if (acceptedTypes !== "image") {
		//
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo imagem'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	const data = {
		"number": requestBody?.groupId + '@g.us',
		"options": {
			"delay": 1200,
			"presence": "composing"
		},
		"stickerMessage": {
			"image": requestBody?.base64
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendSticker/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendStickersFromBase64Grupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	let ext = mime.extension(requestBody.mimetype);
	let acceptedTypes = requestBody.mimetype.split("/")[0];
	//
	if (acceptedTypes !== "image") {
		//
		var validate = {
			"erro": true,
			"status": 400,
			"message": 'Arquivo selecionado não permitido, apenas arquivo do tipo imagem'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(validate.status).json({
			"Status": validate
		});
		//
	}
	//
	const data = {
		"number": requestBody?.groupId + '@g.us',
		"options": {
			"delay": 1200,
			"presence": "composing"
		},
		"stickerMessage": {
			"image": requestBody?.base64
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendSticker/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendPollGrupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"number": requestBody?.groupId + '@g.us',
		"options": {
			"delay": 1200,
			"presence": "composing"
		},
		"pollMessage": {
			"name": requestBody?.name,
			"selectableCount": requestBody?.selectableCount,
			"values": requestBody?.values
		}
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendPoll/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendListGrupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + '@g.us',
		"type": "group",
		"options": {
			"delay": 0,
			"replyFrom": ""
		},
		"groupOptions": {
			"markUser": "ghostMention"
		},
		"msgdata": requestBody?.listMessage
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/list?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/sendButtonGrupo', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + '@g.us',
		"type": "group",
		"options": {
			"delay": 0,
			"replyFrom": ""
		},
		"groupOptions": {
			"markUser": "ghostMention"
		},
		"btndata": requestBody?.btnMessage
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/button?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, requestBody?.groupId);
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
/*
╔═╗┬─┐┌─┐┬ ┬┌─┐  ╔═╗┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
║ ╦├┬┘│ ││ │├─┘  ║ ║├─┘ │ ││ ││││└─┐
╚═╝┴└─└─┘└─┘┴    ╚═╝┴   ┴ ┴└─┘┘└┘└─┘
*/
//
//
router.post('/leaveGroup', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {};
	//
	await axios({
		method: 'DELETE',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/leaveGroup/${SessionName}?groupJid=${requestBody?.groupId}@g.us`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível sair do grupo"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/createGroup', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"name": requestBody?.title,
		"users": requestBody?.participants
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/create?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"groupId": responseData?.data?.id,
			"participants": responseData?.data?.participants,
			"message": "Grupo criado com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível criar o grupo"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/updateGroupTitle', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"subject": requestBody?.title
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/updatesubject?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Titulo do grupo atualizado com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível editar titulo do grupo"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/updateGroupDesc', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"description": requestBody?.desc
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/updatedescription?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Descrição do grupo atualizada com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível editar a descrição do grupo"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/getGroupInviteLink', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us"
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/getinvitecode?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let inviteCode = responseData?.data.split('/').pop();
		let inviteUrl = responseData?.data;
		//
		let result = {
			"erro": false,
			"status": 200,
			"inviteCode": inviteCode,
			"inviteUrl": inviteUrl,
			"message": "Link de convite obtido com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível obter o link de convite do grupo"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/getGroupRevokeInviteLink', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {};
	//
	await axios({
		method: 'PUT',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/revokeInviteCode/${SessionName}?groupJid=${requestBody?.groupId}@g.us`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"revoked": responseData.revoked,
			"inviteCode": responseData.inviteCode,
			"inviteUrl": `https://chat.whatsapp.com/${responseData.inviteCode}`,
			"message": "Link de convite renovado com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível renovar o link de convite do grupo"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/getGroupMembers', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us"
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/groupidinfo?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let novoArray = responseData?.data?.participants.map(function (item) {
			return {
				"id": `${item.id}`,
				"phone": `${item.id}`.split("@")[0],
				"admin": `${item.admin}`
			};
		});
		//
		let result = {
			"erro": false,
			"status": 200,
			"groupId": `${requestBody?.groupId}@g.us`,
			"groupMembers": novoArray,
			"message": "Membros do grupo obtidos com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível obter membros do grupo"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/getInfoGroup', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us"
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/groupidinfo?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//requestBody?.participants ? null : delete responseData.data.participants;
		if (!requestBody?.getParticipants) {
			delete responseData.data.participants;
		}
		//
		let result = {
			"erro": false,
			"status": 200,
			"infoGroup": responseData?.data,
			"message": "Informações do grupo obtidas com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível obter informações do grupo"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/ephemeralGroup', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	// 0 = Off 
	// 86400 = 24 Hours 
	// 604800 = 7 Days 
	// 7776000 = 90 Days
	const data = {
		"expiration": requestBody?.expiration
	};
	//
	await axios({
		method: 'PUT',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/toggleEphemeral/${SessionName}?groupJid=${requestBody?.groupId}@g.us`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		var expirationTime = null;
		//
		if (requestBody.expiration == 86400) {
			expirationTime = '24 Hours';
		} else if (requestBody.expiration == 604800) {
			expirationTime = '7 Days';
		} else if (requestBody.expiration == 7776000) {
			expirationTime = '90 Days';
		} else {
			expirationTime = 'Off';
		}
		//
		let result = {
			"erro": false,
			"status": 200,
			"groupId": `${requestBody?.groupId}@g.us`,
			"expiration": expirationTime,
			"message": "Mensagens temporarias habilitada com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível habilitar mensagens temporarias"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/removeParticipant', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"users": requestBody?.participants
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/removeuser?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"groupId": `${requestBody?.groupId}@g.us`,
			"message": "Participante(s) removido(s) com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível remover o(s) participante(s)"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/addParticipant', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"users": requestBody?.participants
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/inviteuser?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		let result = {
			"erro": false,
			"status": 200,
			"groupId": `${requestBody?.groupId}@g.us`,
			"message": "Participante(s) adicionado(s) com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível adicionar o(s) participante(s)"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/promoteParticipant', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"users": requestBody?.participants
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/makeadmin?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"groupId": `${requestBody?.groupId}@g.us`,
			"message": "Participante(s) promovido(s) com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível promover o(s) participante(s)"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/demoteParticipant', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"users": requestBody?.participants
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/demoteadmin?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"groupId": `${requestBody?.groupId}@g.us`,
			"message": "Participante(s) despromovidos com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível despromover o(s) participante(s)"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/updateGroupPicture', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"type": "group",
		"url": requestBody?.profilePicture
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/misc/updateProfilePicture?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		if (responseData?.data?.error) {
			var result = {
				"erro": false,
				"status": 400,
				"groupId": `${requestBody?.groupId}@g.us`,
				"message": "Não foi possível atualizar a imagem do perfil"
			};
		} else {
			var result = {
				"erro": false,
				"status": 200,
				"groupId": `${requestBody?.groupId}@g.us`,
				"message": "Imagem atualizar do perfil atualizada com sucesso"
			};
		}
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível atualizar a imagem do perfil"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/updateGroupSettings', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	//not_announcement = Todos enviam mensagem
	//announcement = Somente admins enviam mensagem
	//unlocked = Todos podem alterar foto e descrição do grupo
	//locked = Apenas admins podem alterar foto e descrição do grupo
	//
	const data = {
		"id": requestBody?.groupId + "@g.us",
		"action": requestBody?.action
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/misc/updateProfilePicture?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Configuração atualizada com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível atualizar configuração"
				}
			});
		}
		//
	});
	//
});
//
//
/*
╦═╗┌─┐┌┬┐┬─┐┬┌─┐┬  ┬┬┌┐┌┌─┐  ╔╦╗┌─┐┌┬┐┌─┐
╠╦╝├┤  │ ├┬┘│├┤ └┐┌┘│││││ ┬   ║║├─┤ │ ├─┤
╩╚═└─┘ ┴ ┴└─┴└─┘ └┘ ┴┘└┘└─┘  ═╩╝┴ ┴ ┴ ┴ ┴
*/
//
router.post('/getAllContacts', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {};
	//
	await axios({
		method: 'GET',
		maxBodyLength: Infinity,
		url: `${apiUrl}/misc/contacts?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		var contactsList = [];
		//
		responseData?.data?.contacts?.forEach(async (contact) => {
			//
			contactsList.push({
				"wuid": contact?.id,
				"phone": contact?.id?.split("@")[0],
				"name": contact?.name || null
			});
			//
		});
		//
		const result = {
			"error": false,
			"status": 200,
			"getAllContacts": contactsList,
			"message": "Lista de contato(s) obtida com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível obter lista de contato(s)"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/getAllGroups', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {};
	//
	await axios({
		method: 'GET',
		maxBodyLength: Infinity,
		url: `${apiUrl}/group/getallgroups?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		var getAllGroups = [];
		//
		Object.values(responseData?.data || {}).forEach(group => {
			var novoArray = [];
			if (requestBody?.getParticipants && group.participants) {
				novoArray = group.participants.map(function (item) {
					return {
						"id": `${item.id}`,
						"phone": `${item.id}`.split("@")[0],
						"admin": `${item.admin}`
					};
				});
			}
			//
			getAllGroups.push({
				"wuid": group.id.split("@")[0],
				"gpname": group.subject,
				"size": group.size,
				"creation": moment(group.creation * 1000).format("YYYY-MM-DD HH:mm:ss"),
				"desc": group.desc,
				"restrict": group.restrict,
				"announce": group.announce,
				"participants": requestBody?.getParticipants ? novoArray : null
			});
		});
		//
		const result = {
			"error": false,
			"status": 200,
			"getAllGroups": getAllGroups,
			"message": "Lista de grupo(s) obtida com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível obter lista de grupo(s)"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/checkNumberStatus', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/misc/onwhatsapp?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		var result = {};
		//
		if (!responseData?.error) {
			result = {
				"error": false,
				"status": 200,
				"number": responseData?.data?.split("@")[0],
				"message": "O número informado pode receber mensagens via whatsapp"
			};
		} else {
			result = {
				"error": false,
				"status": 200,
				"number": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
				"message": "O número informado não pode receber mensagens via whatsapp"
			};
		}
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível enviar sua mensagem"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/setMyStatus', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	// unavailable = Offline
	// available = Online
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"status": requestBody?.status,
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/misc/mystatus?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"error": false,
			"status": 200,
			"message": "Status atualizado com suceso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		if (responseError?.error && responseError?.message) {
			//
			let resContent = await checkContent(responseError?.message, SessionName, formatTelefone(requestBody?.phonefull).replace(/\D/g, ""));
			if (resContent) { responseError.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(statusCode).json({
				"Status": {
					"erro": true,
					"statusCode": statusCode,
					"message": responseError?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível atualizar o status"
				}
			});
		}
		//
	});
	//
});
//
//
/*
╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐           
╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐           
╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘           
*/
//
router.post('/getPerfilStatus', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"number": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/chat/fetchProfile/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		const result = {
			"error": false,
			"status": 200,
			"fetchProfile": responseData,
			"message": "Detalhes obtidos com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível obter detalhes"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/setProfileName', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"name": requestBody?.profileName,
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/chat/updateProfileName/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		const result = {
			"error": false,
			"status": 200,
			"message": "Profile name alterado com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível alterar profile name"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/setProfileStatus', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"status": requestBody?.profileStatus,
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/chat/updateProfileStatus/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		const result = {
			"error": false,
			"status": 200,
			"message": "Profile name alterado com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível alterar profile name"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/setProfilePicture', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {
		"id": formatTelefone(requestBody?.phonefull).replace(/\D/g, ""),
		"typeId": "user",
		"url": requestBody?.profilePicture
	};
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/misc/updateProfilePicture?key=${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json'
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		if (responseData?.data?.error) {
			var result = {
				"erro": false,
				"status": 400,
				"message": "Não foi possível atualizar a imagem do perfil"
			};
		} else {
			var result = {
				"erro": false,
				"status": 200,
				"message": "Imagem atualizar do perfil atualizada com sucesso"
			};
		}
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível alterar profile name"
				}
			});
		}
		//
	});
	//
});
//
//
router.post('/removeProfilePicture', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.SessionName;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	const data = {};
	//
	await axios({
		method: 'DELETE',
		maxBodyLength: Infinity,
		url: `${apiUrl}/chat/removeProfilePicture/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: data
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		const result = {
			"error": false,
			"status": 200,
			"message": "Profile picture removido com sucesso"
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível remover profile picture"
				}
			});
		}
		//
	});
	//
});
//
//



/*
╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┬ ┬┌─┐┌┐ ┬ ┬┌─┐┌─┐┬┌─
╚═╗├┤  │  │ │││││ ┬  │││├┤ ├┴┐├─┤│ ││ │├┴┐
╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └┴┘└─┘└─┘┴ ┴└─┘└─┘┴ ┴
*/
//



//
//
/*
╔═╗┌─┐┌┬┐┌─┐┬ ┬┌─┐┬ ┬┌─┐  ╔═╗╔╦╗╔═╗
║ ╦├─┤ │ ├┤ │││├─┤└┬┘└─┐  ╚═╗║║║╚═╗
╚═╝┴ ┴ ┴ └─┘└┴┘┴ ┴ ┴ └─┘  ╚═╝╩ ╩╚═╝
*/
//
//
router.post('/gateway/mkauthPlaySms', verifyToken.verify, async (req, res, next) => {
	//
	let originalUrl = req?.originalUrl;
	let requestBody = req?.body;
	let SessionName = requestBody?.u;
	let apiUrlBase = originalUrl;
	let apiUrl = config.API_URL;
	let apiUrlRequest = `${apiUrl}${apiUrlBase}`;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName: ${SessionName}`);
	logger?.info(`- Request Url: ${apiUrl}`);
	logger?.info(`- Request Base: ${apiUrlBase}`);
	logger?.info(`- Request: ${apiUrlRequest}`);
	//
	logger?.info('=====================================================================================================');
	//
	await axios({
		method: 'POST',
		maxBodyLength: Infinity,
		url: `${apiUrl}/message/sendText/${SessionName}`,
		httpsAgent: agent,
		headers: {
			'Content-Type': 'application/json',
			'apikey': SessionName
		},
		data: {
			"number": requestBody?.to.replace(/\D/g, ""),
			"options": {
				"delay": 1200,
				"presence": "composing",
				"linkPreview": false
			},
			"textMessage": {
				"text": requestBody?.msg
			}
		}
	}).then(async (response) => {
		//
		let monitor = await contentMonitor('success', SessionName);
		//
		let responseData = response?.data;
		let statusCode = response?.status;
		let statusText = response?.statusText;
		//
		logger?.info('- Redirect Success');
		// response.body, response.headers, response.status
		//
		logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		let result = {
			"erro": false,
			"status": 200,
			"message": "Mensagem enviada com sucesso."
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(result.status).json({
			"Status": result
		});
		//
		//
	}).catch(async (error) => {
		//
		await contentMonitor(null, SessionName);
		//
		//console.log(error);
		let responseError = error?.response?.data;
		let statusCode = error?.response?.status;
		let statusText = error?.response?.statusText;
		//
		//console.log(JSON.stringify(responseError, undefined, 2));
		//
		logger?.error(`- Redirect Error`);
		//
		//
		logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
		//
		logger?.info('=====================================================================================================');
		//
		//
		if (responseError?.response && responseError?.response?.message) {
			//
			let resContent = await checkContent(responseError?.response?.message, SessionName);
			if (resContent) { responseError.response.message = resContent.message }
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(responseError?.status).json({
				"Status": {
					"erro": true,
					"statusCode": responseError?.status,
					"message": responseError?.response?.message
				}
			});
			//
		} else {
			//
			//await validateOffLine.verify(SessionName);
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(400).json({
				"Status": {
					"erro": true,
					"statusCode": 400,
					"state": "DISCONNECTED",
					"status": "notLogged",
					"message": "Não foi possível verificar o status"
				}
			});
		}
		//
	});
	//
});
//
//
/*
╦═╗ ╦╔═╗
║╔╩╦╝║  
╩╩ ╚═╚═╝
*/
//
router.get('/gateway/ixc', async (req, res, next) => {
	//
	const ip = req.ip;
	const url = req.originalUrl;
	const path = req.path;
	const method = req.method;
	const host = req.get('host');
	const referrer = req.get('referrer');
	//
	const requestQuery = req?.query;
	const SessionName = requestQuery?.user;
	//
	logger?.info('=====================================================================================================');
	//
	logger?.info(`- SessionName Request: ${SessionName}`);
	logger?.info(`- IP: ${ip}`);
	logger?.info(`- URL: ${url}, Caminho: ${path}`);
	logger?.info(`- Método HTTP: ${method}`);
	logger?.info(`- Host: ${host}, Referenciador: ${referrer}`);
	//
	logger?.info('=====================================================================================================');
	//
	try {
		//
		if (Object.keys(requestQuery).length === 0) {
			//
			resultRes = {
				"erro": true,
				"status": 400,
				"message": "Não foi possível enviar a mensagem, nenhuma mensagem informada"
			};
			//
			res.setHeader('Content-Type', 'application/json');
			return res.status(resultRes.status).json({
				"Status": resultRes
			});
			//
		}
		//
		const contemNovamsg = requestQuery?.text?.includes("[NOVAMSG]") ?? false;
		//
		if (contemNovamsg) {
			//
			var setSend = [];
			var indice = 1;
			var indiceError = 0;
			const array = requestQuery?.text.split("[NOVAMSG]");
			for (const body of array) {
				//
				await axios({
					method: 'POST',
					maxBodyLength: Infinity,
					url: `${apiUrl}/message/text?key=${SessionName}`,
					httpsAgent: agent,
					headers: {
						'Content-Type': 'application/json'
					},
					data: {
						"id": formatTelefone(requestQuery.dest).replace(/\D/g, ""),
						"typeId": "user",
						"message": body,
						"options": {
							"delay": 2,
							"replyFrom": ""
						},
						"groupOptions": {
							"markUser": "ghostMention"
						}
					}
				}).then(async (response) => {
					//
					let monitor = await contentMonitor('success', SessionName);
					//
					let responseData = response?.data;
					let statusCode = response?.status;
					let statusText = response?.statusText;
					//
					logger?.info('- Redirect Success');
					// response.body, response.headers, response.status
					//
					logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
					//
					logger?.info('=====================================================================================================');
					//
					let resultRes = {
						"erro": false,
						"status": 200,
						"message": "Mensagem enviada com sucesso."
					};
					//
					setSend.push({ ...resultRes, countMsg: indice });
					indice++;
					//
				}).catch(async (error) => {
					//
					await contentMonitor(null, SessionName);
					//
					//console.log(error);
					let responseError = error?.response?.data;
					let statusCode = error?.response?.status;
					let statusText = error?.response?.statusText;
					//
					//console.log(JSON.stringify(responseError, undefined, 2));
					//
					logger?.error(`- Redirect Error`);
					//
					logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
					//
					logger?.info('=====================================================================================================');
					//
					let resultRes = {
						"erro": true,
						"status": 404,
						"message": "Erro ao enviar menssagem"
					};
					//
					setSend.push({ ...resultRes, countMsg: indice });
					indice++;
					indiceError++;
					//
				});
			};
			//
			return res.status(201).json({
				"Status": setSend
			});
			//
		} else {
			//
			await axios({
				method: 'POST',
				maxBodyLength: Infinity,
				url: `${apiUrl}/message/text?key=${SessionName}`,
				httpsAgent: agent,
				headers: {
					'Content-Type': 'application/json'
				},
				data: {
					"id": formatTelefone(requestQuery.dest).replace(/\D/g, ""),
					"typeId": "user",
					"message": requestQuery.text,
					"options": {
						"delay": 2,
						"replyFrom": ""
					}
				}
			}).then(async (response) => {
				//
				let monitor = await contentMonitor('success', SessionName);
				//
				let responseData = response?.data;
				let statusCode = response?.status;
				let statusText = response?.statusText;
				//
				logger?.info('- Redirect Success');
				// response.body, response.headers, response.status
				//
				logger?.info(`- Success: status ${statusText}, statusCode ${statusCode}`);
				//
				logger?.info('=====================================================================================================');
				//
				let result = {
					"erro": false,
					"status": 200,
					"message": "Mensagem enviada com sucesso."
				};
				//
				res.setHeader('Content-Type', 'application/json');
				res.status(result.status).json({
					"Status": result
				});
				//
			}).catch(async (error) => {
				//
				await contentMonitor(null, SessionName);
				//
				//console.log(error);
				let responseError = error?.response?.data;
				let statusCode = error?.response?.status;
				let statusText = error?.response?.statusText;
				//
				console.log(JSON.stringify(responseError, undefined, 2));
				//
				logger?.error(`- Redirect Error`);
				//
				logger?.error(`- Error: status ${statusText}, statusCode ${statusCode}`);
				//
				logger?.info('=====================================================================================================');
				//
				if (responseError?.response && responseError?.response?.message) {
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(responseError?.status).json({
						"Status": {
							"erro": true,
							"statusCode": responseError?.status,
							"message": responseError?.response?.message
						}
					});
					//
				} else {
					//
					res.setHeader('Content-Type', 'application/json');
					return res.status(400).json({
						"Status": {
							"erro": true,
							"statusCode": 400,
							"state": "DISCONNECTED",
							"status": "notLogged",
							"message": "Não foi possível verificar o status"
						}
					});
				}
				//
			});
			//
		}
		//
	} catch (err) {
		//
		var resultRes;
		//logger?.error(`${err}`);
		//
		if (err?.message?.length === 0) {
			//
			resultRes = {
				"erro": true,
				"status": 400,
				"message": "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
			};
			//
		} else {
			//
			resultRes = {
				"erro": true,
				"status": 400,
				"message": err?.message
			}
			//
		}
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
});
//
/*
┬─┐┌─┐┬ ┬┌┬┐┌─┐┬─┐  ┌─┐┬  ┬  
├┬┘│ ││ │ │ ├┤ ├┬┘  ├─┤│  │  
┴└─└─┘└─┘ ┴ └─┘┴└─  ┴ ┴┴─┘┴─┘
*/
//
router.post('/testRouter', async (req, res, next) => {
	//
	const requestBody = req?.body;
	//
	try {
		await contentMonitor(requestBody.statistic, requestBody.SessionName);
		//
		var resultRes = {
			"erro": false,
			"status": 200,
			"message": 'Rota de teste chamada com sucesso'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	} catch (error) {
		//
		var resultRes = {
			"erro": true,
			"status": 401,
			"message": 'Erro ao chamar rota de teste'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}
	//
});
//
router.all('*', async (req, res, next) => {
	//
	var resultRes = {
		"erro": true,
		"status": 404,
		"message": 'Não foi possivel executar a ação, verifique a url informada.'
	};
	//
	res.setHeader('Content-Type', 'application/json');
	res.status(resultRes.status).json({
		"Status": resultRes
	});
	//
});
//
module.exports = router;