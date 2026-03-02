//
const express = require("express");
const router = express.Router();
const moment = require('moment');
moment?.locale('pt-br');
const requestIp = require('request-ip');
const { logger } = require('../utils/logger');
const { calcularAutonomia } = require('../middleware/AutonomiaNobreak');
const { ViabilidadeCFTV } = require('../middleware/ViabilidadeCFTV');
const { calculateIPInfo } = require('../middleware/CalculadoraIP');
const { testMultiplePorts } = require('../middleware/TestePortasRede');
const { calcularRAM } = require('../middleware/CalculadoraRAM');
const { calcularRAID } = require('../middleware/CalculadoraRAID');
const { calcularComposicaoCorporal, calcularTMB, calcularTDEE } = require('../middleware/CalculadoraCorporal');
const { calcularTransferencia } = require('../middleware/CalculadoraTransferencia');
const { 
	calcularTensao, 
	calcularCorrente, 
	calcularPotenciaDC, 
	calcularConsumoKWh, 
	estimarCustoMensal
} = require('../middleware/CalculadoraEletrica');
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
					tipo_bateria: String(body.tipo_bateria || '').trim(), // Mantém underscores se existirem
					tipo_banco: String(body.tipo_banco || 'paralelo').trim().toLowerCase()
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
					inputs.tipo_bateria,
					inputs.tipo_banco
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

	let clientIp = ip ? ip : requestIp?.getClientIp(req);

	// Limpeza de IPv4 mapeado em IPv6 (ex: ::ffff:127.0.0.1)
	if (typeof clientIp === 'string' && clientIp.startsWith('::ffff:')) {
		clientIp = clientIp.substring(7);
	}

	if (!clientIp) {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'Não foi possível determinar o endereço IP.'
		});
	}

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

	// Se o IP não for informado, tenta obter o IP do cliente automaticamente
	if (!ip) {
		ip = requestIp.getClientIp(req);
	}

	// Limpeza de IPv4 mapeado em IPv6 (ex: ::ffff:127.0.0.1)
	if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
		ip = ip.substring(7);
	}

	// Verificando se algum campo obrigatório está ausente
	if (!ip) {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'Não foi possível determinar o endereço IP.'
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
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'Todos os valores devem ser preenchidos: host, port, timeout. Por favor, corrija e tente novamente.'
		});
	}

	// Verificar se o host é uma string válida
	if (typeof host !== 'string' || host.trim() === '') {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'O campo "host" deve ser uma string válida.'
		});
	}

	// Verificar se o port é um array de números válidos
	if (!Array.isArray(port) || port.some((p) => typeof p !== 'number' || p <= 0)) {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'O campo "port" deve ser um array de números válidos maiores que 0.'
		});
	}

	// Garantir que o timeout seja um número positivo
	timeout = Number(timeout);
	if (isNaN(timeout) || timeout <= 0) {
		return res.status(400).json({
			error: true,
			status: 400,
			result: null,
			message: 'O campo "timeout" deve ser um número positivo.'
		});
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
		// Utilizando api.maclookup.app (Robusta, gratuita e retorna JSON detalhado)
		const resMAC = await fetch(`https://api.maclookup.app/v2/macs/${macaddress}`);
		if (resMAC.ok) {
			const data = await resMAC.json();

			if (data && data.found) {
				return res.status(200).json({
					error: false,
					status: 200,
					result: {
						company: data.company,
						address: data.address,
						country: data.country,
						mac: data.mac,
						updated: data.updated
					},
					message: "Consulta realizada com sucesso."
				});
			} else {
				return res.status(404).json({
					error: true,
					status: 404,
					result: null,
					message: "Fabricante não encontrado."
				});
			}
		} else {
			// Caso a API retorne erro HTTP
			return res.status(resMAC.status).json({
				error: true,
				status: resMAC.status,
				result: null,
				message: "Erro ao efetuar consulta na API externa."
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
router.post('/CalculadoraDataTransfer', async (req, res, next) => {
	//
	try {
		const { tamanho, unidadeTamanho, velocidade, unidadeVelocidade } = req.body || {};

		if (!tamanho || !unidadeTamanho || !velocidade || !unidadeVelocidade) {
			return res.status(400).json({
				error: true,
				status: 400,
				result: null,
				message: 'Todos os valores devem ser preenchidos: tamanho, unidadeTamanho, velocidade, unidadeVelocidade.'
			});
		}

		const resultado = calcularTransferencia(
			Number(tamanho),
			String(unidadeTamanho),
			Number(velocidade),
			String(unidadeVelocidade)
		);

		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			message: "Cálculo realizado com sucesso."
		});
	} catch (error) {
		logger.error(`- Erro CalculadoraDataTransfer: ${error.message}`);
		return res.status(500).json({
			error: true,
			status: 500,
			result: null,
			message: error.message || 'Erro ao realizar o cálculo.'
		});
	}
});
//
//
router.post('/LatenciaLarguraBandaRAM', async (req, res, next) => {
	try {
		const { cas, frequencia, canais, largura_bus } = req.body || {};

		if (!cas || !frequencia) {
			return res.status(400).json({
				error: true,
				status: 400,
				message: 'Informe CAS (CL) e Frequência (MHz).'
			});
		}

		// Define padrões se não forem enviados (Single Channel, 64 bits)
		const channelsInput = canais ? Number(canais) : 1;
		const widthInput = largura_bus ? Number(largura_bus) : 64;

		// A ordem dos parâmetros no middleware agora é: speed, cas, channels, width
		const resultado = calcularRAM(Number(frequencia), Number(cas), channelsInput, widthInput);

		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			message: "Cálculo de RAM realizado com sucesso."
		});
	} catch (error) {
		logger.error(`- Erro RAM: ${error.message}`);
		return res.status(500).json({ error: true, status: 500, message: error.message });
	}
});
//
//
router.post('/CalculadoraRAID', async (req, res, next) => {
	try {
		const { capacidadeDisco, qtdDiscos, nivelRaid } = req.body || {};

		if (!capacidadeDisco || !qtdDiscos || nivelRaid === undefined) {
			return res.status(400).json({
				error: true,
				status: 400,
				message: 'Informe capacidadeDisco, qtdDiscos e nivelRaid.'
			});
		}

		const resultado = calcularRAID(Number(capacidadeDisco), Number(qtdDiscos), String(nivelRaid));

		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			message: "Cálculo de RAID realizado com sucesso."
		});
	} catch (error) {
		logger.error(`- Erro RAID: ${error.message}`);
		return res.status(400).json({ error: true, status: 400, message: error.message });
	}
});
//
router.post('/CalculadoraMassaMagra', async (req, res, next) => {
	try {
		const { genero, cintura, pescoco, quadril, altura, peso } = req.body || {};

		if (!genero || !cintura || !pescoco || !altura || !peso) {
			return res.status(400).json({
				error: true,
				status: 400,
				message: 'Campos obrigatórios: genero, cintura, pescoco, altura, peso.'
			});
		}

		const resultado = calcularComposicaoCorporal(
			String(genero).toLowerCase(),
			Number(cintura),
			Number(pescoco),
			quadril ? Number(quadril) : 0,
			Number(altura),
			Number(peso)
		);

		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			message: "Cálculo de composição corporal realizado com sucesso."
		});
	} catch (error) {
		logger.error(`- Erro Massa Magra: ${error.message}`);
		return res.status(400).json({ error: true, status: 400, message: error.message });
	}
});
//
router.post('/CalculadoraTMB', async (req, res, next) => {
	try {
		const { formula, genero, peso, altura, idade, massa_magra, nivelAtividade } = req.body || {};

		if (!formula || !genero || !peso || !altura || !idade || !nivelAtividade) {
			return res.status(400).json({
				error: true,
				status: 400,
				message: 'Campos obrigatórios: formula, genero, peso, altura, idade, nivelAtividade.'
			});
		}

		const tmb = calcularTMB(
			String(formula).toLowerCase(),
			String(genero).toLowerCase(),
			Number(peso),
			Number(altura),
			Number(idade),
			massa_magra ? Number(massa_magra) : 0
		);

		const resultado = calcularTDEE(tmb, String(nivelAtividade).toLowerCase());
		resultado.formula_usada = formula;

		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			message: "Cálculo de TMB realizado com sucesso."
		});
	} catch (error) {
		logger.error(`- Erro TMB: ${error.message}`);
		return res.status(400).json({ error: true, status: 400, message: error.message });
	}
});
//
router.post('/CalculadoraEletrica', async (req, res, next) => {
	try {
		const body = req.body || {};
		const acao = body.acao;

		if (!acao) {
			return res.status(400).json({ error: true, status: 400, message: "Ação não informada." });
		}

		let resultado = null;
		let unidade = "";
		
		// Sanitização dos inputs possíveis
		const inputs = {
			tensao: parseNumber(body.tensao),
			corrente: parseNumber(body.corrente),
			resistencia: parseNumber(body.resistencia),
			potencia_w: parseNumber(body.potencia_w),
			horas_uso: parseNumber(body.horas_uso),
			dias_uso: body.dias_uso ? parseInt(body.dias_uso) : 30,
			preco_kwh: parseNumber(body.preco_kwh)
		};

		switch (acao) {
			case 'tensao_lei_ohm':
				resultado = calcularTensao(inputs.resistencia, inputs.corrente, null);
				unidade = 'Volts (V)';
				break;
			case 'tensao_potencia':
				resultado = calcularTensao(null, inputs.corrente, inputs.potencia_w);
				unidade = 'Volts (V)';
				break;
			case 'corrente_lei_ohm':
				resultado = calcularCorrente(inputs.tensao, inputs.resistencia, null);
				unidade = 'Amperes (A)';
				break;
			case 'corrente_potencia':
				resultado = calcularCorrente(inputs.tensao, null, inputs.potencia_w);
				unidade = 'Amperes (A)';
				break;
			case 'potencia_dc':
				resultado = calcularPotenciaDC(inputs.tensao, inputs.corrente);
				unidade = 'Watts (W)';
				break;
			case 'custo_energia':
				const kwh = calcularConsumoKWh(inputs.potencia_w, inputs.horas_uso, inputs.dias_uso);
				const custo = estimarCustoMensal(kwh, inputs.preco_kwh || 0);
				resultado = {
					consumo_kwh: parseFloat(kwh.toFixed(2)),
					custo_estimado: parseFloat(custo.toFixed(2))
				};
				unidade = 'Mensal';
				break;
			default:
				return res.status(400).json({ error: true, status: 400, message: "Ação inválida ou desconhecida." });
		}

		// Formatação se for número simples
		if (typeof resultado === 'number') {
			resultado = parseFloat(resultado.toFixed(2));
		}

		return res.status(200).json({
			error: false,
			status: 200,
			result: resultado,
			unidade: unidade,
			message: "Cálculo realizado com sucesso."
		});
	} catch (error) {
		logger.error(`- Erro CalculadoraEletrica: ${error.message}`);
		return res.status(500).json({ error: true, status: 500, message: error.message });
	}
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