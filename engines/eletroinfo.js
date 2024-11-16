//
const express = require("express");
const router = express.Router();
const https = require('https');
const axios = require('axios');
const mime = require('mime-types');
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const requestIp = require('request-ip')
const config = require('../config.global');
const { logger } = require('../utils/logger');
const { calcularAutonomia } = require('../middleware/AutonomiaNobreak');
const { ViabilidadeCFTV } = require('../middleware/ViabilidadeCFTV');
//
//
/*
╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
*/
//
router.post('/AutonomiaNobreak', async (req, res, next) => {

	let requestBody = req?.body;
	let carga_aplicada = requestBody?.carga_aplicada;
	let tensao_bateria = requestBody?.tensao_bateria;
	let capacidade_bateria = requestBody?.capacidade_bateria;
	let quantidade_baterias = requestBody?.quantidade_baterias;
	let tipo_bateria = requestBody?.tipo_bateria;

	// Verificando se algum campo obrigatório está ausente
	if (!carga_aplicada || !tensao_bateria || !capacidade_bateria || !quantidade_baterias || !tipo_bateria) {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'Todos os valores devem ser preenchidos: carga_aplicada, tensao_bateria, capacidade_bateria, quantidade_baterias, tipo_bateria. Por favor, corrija e tente novamente.'
		});
	}

	try {
		// Calculando a autonomia
		const resultado = calcularAutonomia(carga_aplicada, tensao_bateria, capacidade_bateria, quantidade_baterias, tipo_bateria);

		// Retornando sucesso com o formato esperado
		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			message: "Cálculo realizado com sucesso."
		});
	} catch (error) {
		// Capturando e retornando erro interno
		return res.status(500).json({
			error: true,
			status: 500,
			result: null,
			message: 'Erro ao calcular a autonomia'
		});
	}

});
//
//
router.post('/ViabilidadeCFTV', async (req, res, next) => {

	let requestBody = req?.body;
	let tensao_fonte = requestBody?.tensao_fonte;
	let bitola_cabo = requestBody?.bitola_cabo;
	let distancia = requestBody?.distancia;
	let tensao_camera = requestBody?.tensao_camera;
	let corrente_camera = requestBody?.corrente_camera;

	// Verificando se algum campo obrigatório está ausente
	if (!tensao_fonte || !bitola_cabo || !distancia || !tensao_camera || !corrente_camera) {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'Todos os valores devem ser preenchidos: tensao_fonte, bitola_cabo, distancia, tensao_camera, corrente_camera. Por favor, corrija e tente novamente.'
		});
	}

	try {
		// Calculando a autonomia
		const resultado = ViabilidadeCFTV(bitola_cabo, tensao_fonte, tensao_camera, corrente_camera, distancia);

		// Retornando sucesso com o formato esperado
		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			message: "Cálculo realizado com sucesso."
		});
	} catch (error) {
		// Capturando e retornando erro interno
		return res.status(500).json({
			error: true,
			status: 500,
			result: null,
			message: 'Erro ao calcular a viabilidade'
		});
	}

});
//
//
router.post('/ConsultaIP', async (req, res, next) => {
	//
	let requestBody = req?.body;
	let ipCliente = req?.connection?.remoteAddress || req?.socket?.remoteAddress || req?.connection?.socket?.remoteAddress;
	let clientIp = requestBody?.ip ? requestBody?.ip : requestIp?.getClientIp(req);
	//
	try {
		const resip = await fetch(`https://get.geojs.io/v1/ip/geo/${clientIp}.json`);
		if (resip.ok) {
			const data = await resip.json();
			return res.status(200).json({
				error: false,
				status: 200,
				result: data,
				message: "Consulta realizada com sucesso."
			});
		}
	} catch (error) {
		// Capturando e retornando erro interno
		console.log(error);
		return res.status(500).json({
			error: true,
			status: 500,
			result: null,
			message: 'Endereço IP inválido ou não encontrado.'
		});
	}
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
	let ipCliente = req?.connection?.remoteAddress || req?.socket?.remoteAddress || req?.connection?.socket?.remoteAddress;
	let clientIp = requestBody?.ip ? requestBody?.ip : requestIp?.getClientIp(req);
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