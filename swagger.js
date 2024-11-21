require('dotenv').config();
const config = require('./config.global');
if (config.DOMAIN_SSL) {
	var serverURL = `https://${config.DOMAIN_SSL}`;
} else {
	var serverURL = `http://${config.HOST}:${config.PORT}`;
}
//
module.exports = {
	"openapi": "3.0.3",
	"info": {
		"description": "EletroInfo :: Eletro Informática - Para assegurar a excelência dos nossos serviços, a Eletroinfo continua a explorar e adotar constantemente inovações tecnológicas, com o objetivo primordial de satisfazer plenamente os nossos clientes.",
		"version": "1.0.0",
		"title": "API - Eletro Info"
	},
	"tags": [
		{
			"name": "Cálculo de Autonomia de Nobreak",
			"description": "Calcula a autonomia de um nobreak com base no consumo, potência e tempo de operação, ajudando a determinar o modelo mais adequado para sua necessidade."
		},
		{
			"name": "Viabilidade de Instalação de CFTV",
			"description": "Analisa a viabilidade de instalação de sistemas de CFTV considerando fatores como área coberta, quantidade de câmeras e infraestrutura disponível."
		},
		{
			"name": "Consulta de IP",
			"description": "Fornece informações detalhadas sobre um endereço IP, como tipo (IPv4/IPv6), localização aproximada e provedor de internet."
		},
		{
			"name": "Calculadora de IP (IPv4)",
			"description": "Realiza cálculos de sub-redes IPv4, exibindo detalhes como máscara de rede, IP inicial e final, além da quantidade de hosts disponíveis."
		},
		{
			"name": "Calculadora de IP (IPv6)",
			"description": "Calcula sub-redes IPv6, gerando informações como prefixo de rede, IP inicial e final, e o total de endereços disponíveis na sub-rede."
		},
		{
			"name": "Geolocalização de IP",
			"description": "Localiza geograficamente um endereço IP, fornecendo informações como país, cidade e provedor associado ao endereço."
		},
		{
			"name": "Teste de Portas de Rede",
			"description": "Verifica a disponibilidade ou bloqueio de portas específicas em uma rede, auxiliando no diagnóstico de problemas de conectividade."
		},
		{
			"name": "Consulta de Fabricante de MAC",
			"description": "Identifica o fabricante de dispositivos a partir de endereços MAC, útil para diagnósticos e organização de redes."
		},
		{
			"name": "Calculadora de Transferência de Dados",
			"description": "Calcula o tempo necessário para transferir arquivos com base no tamanho e na velocidade da conexão, otimizando o planejamento de transferências."
		},
		{
			"name": "Cálculo de Latência e Largura de Banda",
			"description": "Avalia a performance da memória RAM calculando a latência e a largura de banda, fornecendo métricas detalhadas para otimização do sistema."
		},
		{
			"name": "Calculadora de Metabolismo Basal (TMB)",
			"description": "Calcula o metabolismo basal de uma pessoa usando dados como idade, peso, altura e gênero, auxiliando no planejamento de dietas e treinos."
		}
	],
	"servers": [
		{
			"url": `${serverURL}`,
			"description": ""
		}
	],
	"components": {
		"schemas": {

		}
	},
	"paths": {
		"/api/AutonomiaNobreak": {
			"post": {
				"tags": [
					"Cálculo de Autonomia de Nobreak"
				],
				"summary": "Cálculo de Autonomia de Nobreak",
				"description": "",
				"requestBody": {
					"required": true,
					"content": {
						"multipart/form-data": {
							"schema": {
								"type": "object",
								"properties": {
									"carga_aplicada": {
										"type": "integer",
										"description": "Consumo do equipamento em watts (W).",
										"default": 100
									},
									"tensao_bateria": {
										"type": "integer",
										"description": "Tensão nominal da bateria em volts (V).",
										"default": 12
									},
									"capacidade_bateria": {
										"type": "integer",
										"description": "Capacidade nominal da bateria em ampere (A).",
										"default": 7
									},
									"quantidade_baterias": {
										"type": "integer",
										"description": "Quantidade de baterias no sistema.",
										"default": 2
									},
									"tipo_bateria": {
										"type": "string",
										"description": "Tipo da bateria (veja lista de valores válidos).",
										"default": "chumbo_acido"
									},
								},
								"required": [
									"SessionName"
								]
							}
						},
						"application/json": {
							"schema": {
								"type": "object",
								"properties": {
									"carga_aplicada": {
										"type": "integer",
										"description": "Consumo do equipamento em watts (W).",
										"default": 100
									},
									"tensao_bateria": {
										"type": "integer",
										"description": "Tensão nominal da bateria em volts (V).",
										"default": 12
									},
									"capacidade_bateria": {
										"type": "integer",
										"description": "Capacidade nominal da bateria em ampere (A).",
										"default": 7
									},
									"quantidade_baterias": {
										"type": "integer",
										"description": "Quantidade de baterias no sistema.",
										"default": 2
									},
									"tipo_bateria": {
										"type": "string",
										"description": "Tipo da bateria (veja lista de valores válidos).",
										"default": "chumbo_acido"
									},
								},
								"required": [
									"carga_aplicada",
									"tensao_bateria",
									"capacidade_bateria",
									"quantidade_baterias",
									"tipo_bateria",
								]
							}
						}
					}
				},
				"security": [
					{

					}
				],
				"responses": {
					"200": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"error": false,
										"status": 200,
										"result": {
											"tensaocorte": 19.8,
											"autonomia": "09:25:04"
										},
										"message": "Cálculo realizado com sucesso."
									}
								}
							}
						}
					},

					"400": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"error": true,
										"status": 400,
										"result": null,
										"message": "Todos os valores devem ser preenchidos: carga_aplicada, tensao_bateria, capacidade_bateria, quantidade_baterias, tipo_bateria. Por favor, corrija e tente novamente."
									}
								}
							}
						}
					},

					"404": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"Status": {
											"error": true,
											"status": 404,
											"message": "Json gerado de forma incorreta, efetue a correção e tente novamente"
										}
									}
								}
							}
						}
					},

					"500": {
						"description": "",
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"example": {
										"error": true,
										"status": 500,
										"result": null,
										"message": "Erro ao calcular a autonomia."
									}
								}
							}
						}
					}

				}
			}
		}
	}
};