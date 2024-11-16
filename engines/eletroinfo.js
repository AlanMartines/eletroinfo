//
const express = require("express");
const router = express.Router();
const https = require('https');
const axios = require('axios');
const mime = require('mime-types');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const config = require('../config.global');
const { logger } = require('../utils/logger');
const agent = new https.Agent({
	rejectUnauthorized: false
});
//
//
/*
╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
*/
//
router.post('/AutonomiaNobreak', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/ViabilidadeCFTV', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/ConsultaIP', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/CalculadoraIPv4', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/CalculadoraIPv6', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/GeolocalizacaoIP', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/TestePortasRede', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/ConsultaFabricanteMAC', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/CalculadoraTransferenciaDados', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/LatenciaLarguraBandaRAM', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
//
router.post('/CalculadoraTMB', async (req, res, next) => {
	//
	let requestBody = req?.body;
	//
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
	if (req?.body == undefined || req?.body?.SessionName == undefined) {
		var resultRes = {
			"error": true,
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
	logger?.info('=====================================================================================================');
	logger?.info('=====================================================================================================');
	//
});
//
/*
┬─┐┌─┐┬ ┬┌┬┐┌─┐┬─┐  ┌─┐┬  ┬  
├┬┘│ ││ │ │ ├┤ ├┬┘  ├─┤│  │  
┴└─└─┘└─┘ ┴ └─┘┴└─  ┴ ┴┴─┘┴─┘
*/
//
router.all('*', async (req, res, next) => {
	//
	var resultRes = {
		"error": true,
		"status": 404,
		"message": 'Não foi possivel executar a ação, verifique a url informada e tente novamente.'
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