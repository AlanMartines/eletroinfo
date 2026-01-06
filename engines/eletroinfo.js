//
const express = require("express");
const router = express.Router();
const moment = require('moment');
moment()?.format('YYYY-MM-DD HH:mm:ss');
moment?.locale('pt-br');
const requestIp = require('request-ip')
const { logger } = require('../utils/logger');
const { calcularAutonomia } = require('../middleware/AutonomiaNobreak');
const { ViabilidadeCFTV } = require('../middleware/ViabilidadeCFTV');
const { calculateIPInfo } = require('../middleware/CalculadoraIP');
const { testMultiplePorts } = require('../middleware/TestePortasRede');
//
// Helper para limpar e converter números (aceita "10,5" ou "10.5")
function parseNumber(value) {
	if (!value) return null;
	const str = String(value).replace(/\s+/g, '').replace(',', '.');
	const num = parseFloat(str);
	return isNaN(num) || num <= 0 ? null : num;
}
//
/*
╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
*/
//
router.post('/AutonomiaNobreak', async (req, res) => {
	try {
			const body = req.body || {};

			// 1. Sanitização e Conversão de Tipos
			// Remove espaços apenas do tipo, converte números e troca vírgula por ponto
			const inputs = {
					carga_aplicada: parseNumber(body.carga_aplicada),
					tensao_bateria: parseNumber(body.tensao_bateria),
					capacidade_bateria: parseNumber(body.capacidade_bateria),
					quantidade_baterias: parseNumber(body.quantidade_baterias),
					tipo_bateria: String(body.tipo_bateria || '').trim() // Mantém underscores se existirem
			};

			// 2. Validação de Campos Obrigatórios e Valores Numéricos
			const camposInvalidos = [];
			if (!inputs.carga_aplicada) camposInvalidos.push('carga_aplicada');
			if (!inputs.tensao_bateria) camposInvalidos.push('tensao_bateria');
			if (!inputs.capacidade_bateria) camposInvalidos.push('capacidade_bateria');
			if (!inputs.quantidade_baterias) camposInvalidos.push('quantidade_baterias');
			if (!inputs.tipo_bateria) camposInvalidos.push('tipo_bateria');

			if (camposInvalidos.length > 0) {
					return res.status(400).json({
							error: true,
							status: 400,
							result: null,
							message: `Valores inválidos ou ausentes: ${camposInvalidos.join(', ')}. Certifique-se de enviar números maiores que zero.`
					});
			}

			// 3. Execução do Cálculo
			const resultado = calcularAutonomia(
					inputs.carga_aplicada,
					inputs.tensao_bateria,
					inputs.capacidade_bateria,
					inputs.quantidade_baterias,
					inputs.tipo_bateria
			);

			return res.status(200).json({
					error: false,
					status: 200,
					result: resultado,
					message: "Cálculo realizado com sucesso."
			});

	} catch (error) {
			logger.error(`- Erro na rota /AutonomiaNobreak: ${error.message}`);
			return res.status(500).json({
					error: true,
					status: 500,
					result: null,
					message: 'Erro interno ao calcular a autonomia.'
			});
	}
});
//
//
router.post('/ViabilidadeCFTV', async (req, res) => {
	try {
			const body = req.body || {};

			// 1. Sanitização e Conversão
			// Aceita "12,8" ou "12.8"
			const inputs = {
					tensao_fonte: parseNumber(body.tensao_fonte),
					bitola_cabo: parseInt(body.bitola_cabo), // Mantém int para o índice 0-7
					distancia: parseNumber(body.distancia),
					tensao_camera: parseNumber(body.tensao_camera),
					corrente_camera: parseNumber(body.corrente_camera)
			};

			// 2. Validação
			const camposInvalidos = [];
			if (!inputs.tensao_fonte) camposInvalidos.push('tensao_fonte');
			// Verifica se bitola é um número e não é NaN (aceita 0)
			if (inputs.bitola_cabo === null || isNaN(inputs.bitola_cabo)) camposInvalidos.push('bitola_cabo');
			if (!inputs.distancia) camposInvalidos.push('distancia');
			if (!inputs.tensao_camera) camposInvalidos.push('tensao_camera');
			if (!inputs.corrente_camera) camposInvalidos.push('corrente_camera');

			if (camposInvalidos.length > 0) {
					return res.status(400).json({
							error: true,
							status: 400,
							result: null,
							message: `Valores inválidos ou ausentes: ${camposInvalidos.join(', ')}.`
					});
			}

			// 3. Cálculo
			const resultado = ViabilidadeCFTV(
					inputs.bitola_cabo,
					inputs.tensao_fonte,
					inputs.tensao_camera,
					inputs.corrente_camera,
					inputs.distancia
			);

			return res.status(200).json({
					error: false,
					status: 200,
					result: resultado,
					message: "Cálculo de viabilidade realizado com sucesso."
			});

	} catch (error) {
			logger.error(`- Erro CFTV: ${error.message}`);
			// Retorna erro amigável se a bitola não existir
			const status = error.message.includes("Bitola") ? 400 : 500;
			
			return res.status(status).json({
					error: true,
					status: status,
					result: null,
					message: error.message || 'Erro interno ao calcular viabilidade.'
			});
	}
});
//
//
router.post('/CalculadoraIPv4', async (req, res, next) => {

	// Capturar e sanitizar os valores do corpo da requisição
	let requestBody = req?.body;

	// Garantir que os valores sejam strings antes de usar o .replace()
	let ipAddress = String(requestBody?.ipAddress || '').replace(/\s+/g, '');
	let subnetMask = String(requestBody?.subnetMask || '').replace(/\s+/g, '');

	if (!ipAddress || !subnetMask) {
		var resultRes = {
			error: true,
			status: 400,
			result: null,
			message: 'Todos os valores devem ser preenchidos: ipAddress, subnetMask. Por favor, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}

	try {
		// Calculando a autonomia
		const resultado = calculateIPInfo(requestBody?.ipAddress, requestBody?.subnetMask);

		// Retornando sucesso com o formato esperado
		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			message: "Cálculo realizado com sucesso."
		});
	} catch (error) {
		// Capturando e retornando erro interno
		logger.error(`- Erro: ${error?.message}`);
		return res.status(500).json({
			error: true,
			status: 500,
			result: null,
			message: error?.message
		});
	}

});
//
//
router.post('/CalculadoraIPv6', async (req, res, next) => {

	// Capturar e sanitizar os valores do corpo da requisição
	let requestBody = req?.body;

	// Garantir que os valores sejam strings antes de usar o .replace()
	let ipAddress = String(requestBody?.ipAddress || '').replace(/\s+/g, '');
	let subnetMask = String(requestBody?.subnetMask || '').replace(/\s+/g, '');

	if (!ipAddress || !subnetMask) {
		var resultRes = {
			error: true,
			status: 400,
			result: null,
			message: 'Todos os valores devem ser preenchidos: ipAddress, subnetMask. Por favor, corrija e tente novamente.'
		};
		//
		res.setHeader('Content-Type', 'application/json');
		return res.status(resultRes.status).json({
			"Status": resultRes
		});
		//
	}

	try {
		// Calculando a autonomia
		const resultado = calculateIPInfo(ipAddress, subnetMask);

		// Retornando sucesso com o formato esperado
		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			message: "Cálculo realizado com sucesso."
		});
	} catch (error) {
		// Capturando e retornando erro interno
		logger.error(`- Erro: ${error?.message}`);
		return res.status(500).json({
			error: true,
			status: 500,
			result: null,
			message: error?.message
		});
	}

});
//
//
router.post('/ConsultaIP', async (req, res, next) => {

	// Capturar e sanitizar o valor do campo 'ip' do corpo da requisição
	let requestBody = req?.body;

	// Garantir que o valor seja tratado como string antes de usar o .replace()
	let ip = String(requestBody?.ip || '').replace(/\s+/g, '');

	let ipCliente = req?.connection?.remoteAddress || req?.socket?.remoteAddress || req?.connection?.socket?.remoteAddress;
	let clientIp = ip ? ip : requestIp?.getClientIp(req);
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
		} else {
			// Caso a API retorne erro HTTP
			return res.status(resip.status).json({
				error: true,
				status: resip.status,
				result: null,
				message: "Erro ao efetuar consulta."
			});
		}
	} catch (error) {
		// Capturando e retornando erro interno
		logger.error(`- Erro: ${error?.message}`);
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
router.post('/GeolocalizacaoIP', async (req, res, next) => {

	// Capturar e sanitizar o valor do campo 'ip' do corpo da requisição
	let requestBody = req?.body;

	// Garantir que o valor seja tratado como string antes de usar o .replace()
	let ip = String(requestBody?.ip || '').replace(/\s+/g, '');

	// Verificando se algum campo obrigatório está ausente
	if (!ip) {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'O ip deve ser preenchido. Por favor, corrija e tente novamente.'
		});
	}

	try {
		const resGeoIP = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`);
		if (resGeoIP.ok) {
			const data = await resGeoIP.json();
			return res.status(200).json({
				error: false,
				status: 200,
				result: data,
				message: "Consulta realizada com sucesso."
			});
		} else {
			// Caso a API retorne erro HTTP
			return res.status(resGeoIP.status).json({
				error: true,
				status: resGeoIP.status,
				result: null,
				message: "Erro ao efetuar consulta."
			});
		}
	} catch (error) {
		// Capturando e retornando erro interno
		logger.error(`- Erro: ${error?.message}`);
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
router.post('/TestePortasRede', async (req, res, next) => {

	let requestBody = req?.body;

	// Garantir que o valor seja tratado como string antes de usar .replace()
	let host = String(requestBody?.host || '').replace(/\s+/g, '');
	let port = requestBody?.port || '';
	let timeout = String(requestBody?.timeout || '').replace(/\s+/g, '');

	// Verificando se os campos obrigatórios estão ausentes
	if (!host || !port || !timeout) {
		return {
			error: true,
			status: 400,
			result: null,
			message: 'Todos os valores devem ser preenchidos: host, port, timeout. Por favor, corrija e tente novamente.'
		};
	}

	// Verificar se o host é uma string válida
	if (typeof host !== 'string' || host.trim() === '') {
		return {
			error: true,
			status: 400,
			result: null,
			message: 'O campo "host" deve ser uma string válida.'
		};
	}

	// Verificar se o port é um array de números válidos
	if (!Array.isArray(port) || port.some((p) => typeof p !== 'number' || p <= 0)) {
		return {
			error: true,
			status: 400,
			result: null,
			message: 'O campo "port" deve ser um array de números válidos maiores que 0.'
		};
	}

	// Garantir que o timeout seja um número positivo
	timeout = Number(timeout);
	if (isNaN(timeout) || timeout <= 0) {
		return {
			error: true,
			status: 400,
			result: null,
			message: 'O campo "timeout" deve ser um número positivo.'
		};
	}

	try {
		//
		const result = await testMultiplePorts(host, port, timeout);

		// Retornando sucesso com o formato esperado
		return res.status(200).json({
			error: false,
			status: 200,
			result: result,
			message: "Teste realizado com sucesso."
		});
	} catch (error) {
		// Capturando e retornando erro interno
		logger.error(`- Erro: ${error?.message}`);
		return res.status(500).json({
			error: true,
			status: 500,
			result: null,
			message: 'Erro ao realizar o teste'
		});
	}

});
//
//
router.post('/ConsultaFabricanteMAC', async (req, res, next) => {
	//
	// Function to validate the
	// MAC_Address  
	function isValidMACAddress(str) {
		// Regex to check valid MAC Address in two common formats:
		// - XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
		// - XXXX.XXXX.XXXX (Cisco format)
		const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})$/;

		// Ensure the input is a string and not null or undefined
		if (typeof str !== 'string' || !str.trim()) {
			return false;
		}

		// Test the input string against the regex and return the result
		return regex.test(str);
	}
	//
	let requestBody = req?.body;
	let macaddress = requestBody?.macaddress;

	// Verificando se algum campo obrigatório está ausente
	if (!macaddress) {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'O MAC Address deve ser preenchido. Por favor, corrija e tente novamente.'
		});
	}

	// Verificando se é um mac valido
	if (!isValidMACAddress(macaddress)) {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'O MAC Address invalido. Por favor, corrija e tente novamente.'
		});
	}

	try {
		const resMAC = await fetch(`https://www.macvendorlookup.com/api/v2/${macaddress}/json`);
		if (resMAC.ok) {
			const data = await resMAC.json();

			// Validação da estrutura do JSON retornado
			const isArray = Array.isArray(data);
			if (isArray) {
				// Validar se todos os elementos do array têm o formato esperado
				return res.status(200).json({
					error: false,
					status: 200,
					result: data[0],
					message: "Consulta realizada com sucesso."
				});
			} else {
				// Resposta é um único objeto válido
				return res.status(200).json({
					error: false,
					status: 200,
					result: data,
					message: "Consulta realizada com sucesso."
				});
			}

		} else {
			// Caso a API retorne erro HTTP
			return res.status(resMAC.status).json({
				error: true,
				status: resMAC.status,
				result: null,
				message: "Erro ao efetuar consulta."
			});
		}
	} catch (error) {
		// Capturando e retornando erro interno
		logger.error(`- Erro: ${error?.message}`);
		return res.status(500).json({
			error: true,
			status: 500,
			result: null,
			message: 'MAC Address inválido ou não encontrado.'
		});
	}

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
router.post('/CalculadoraRAID', async (req, res, next) => {
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