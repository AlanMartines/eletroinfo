require('dotenv').config();
const config = require('./config.global');
const serverURL = config.DOMAIN_SSL ? `https://${config.DOMAIN_SSL}` : `http://${config.HOST}:${config.PORT}`;
//
module.exports = {
	"definition": {
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
				"AutonomiaNobreakRequest": {
					"type": "object",
					"properties": {
						"carga_aplicada": {
							"type": "integer",
							"description": "Consumo do equipamento em watts (W).",
							"example": 100
						},
						"tensao_bateria": {
							"type": "integer",
							"description": "Tensão nominal da bateria em volts (V).",
							"example": 12
						},
						"capacidade_bateria": {
							"type": "integer",
							"description": "Capacidade nominal da bateria em ampere-hora (Ah).",
							"example": 7
						},
						"quantidade_baterias": {
							"type": "integer",
							"description": "Quantidade de baterias no sistema.",
							"example": 2
						},
						"tipo_bateria": {
							"type": "string",
							"description": "Tipo da bateria.",
							"example": "chumbo_acido"
						}
					},
					"required": [
						"carga_aplicada",
						"tensao_bateria",
						"capacidade_bateria",
						"quantidade_baterias",
						"tipo_bateria"
					]
				},
				"ViabilidadeCFTVRequest": {
					"type": "object",
					"properties": {
						"tensao_fonte": {
							"type": "integer",
							"description": "Tensão da fonte de alimentação em volts (V).",
							"example": 12
						},
						"bitola_cabo": {
							"type": "integer",
							"description": "Bitola do cabo em milímetros quadrados (mm²).",
							"example": 5
						},
						"distancia": {
							"type": "integer",
							"description": "Distância entre a fonte e a câmera em metros (m)",
							"example": 67
						},
						"tensao_camera": {
							"type": "integer",
							"description": "Tensão mínima necessária para o funcionamento da câmera em volts (V)",
							"example": 12
						},
						"corrente_camera": {
							"type": "integer",
							"description": "Corrente consumida pela câmera em amperes (A).",
							"example": 1
						}
					},
					"required": [
						"tensao_fonte",
						"bitola_cabo",
						"distancia",
						"tensao_camera",
						"corrente_camera"
					]
				}
			}
		},
		"paths": {
			"/api/AutonomiaNobreak": {
				"post": {
					"tags": [
						"Cálculo de Autonomia de Nobreak"
					],
					"summary": "Cálculo de Autonomia de Nobreak",
					"description": "Os seguintes parâmetros devem ser fornecidos no corpo da requisição:\n\n- **carga_aplicada:** Consumo do equipamento em watts (W).\n- **tensao_bateria:** Tensão nominal da bateria em volts (V).\n- **capacidade_bateria:** Capacidade nominal da bateria em ampere-hora (Ah).\n- **quantidade_baterias:** Quantidade de baterias no sistema.\n- **tipo_bateria:** Tipo da bateria (veja lista de valores válidos).\n\n## Valores Válidos para o Campo `tipo_bateria`\n\n- `chumbo_acido` - Chumbo-Ácido (Lead-Acid)\n- `ion_litio` - Íon de Lítio (Li-ion)\n- `niquel_cadmio` - Níquel-Cádmio (NiCd)\n- `niquel_hidreto_metalico` - Níquel-Hidreto Metálico (NiMH)\n- `lithium_ferro_fosfato` - Lítio-Ferro-Fosfato (LiFePO4)\n- `lithium_polimero` - Lítio-Polímero (LiPo)\n- `zinco_ar` - Zinco-Ar (Zn-Air)\n- `niquel_ferro` - Níquel-Ferro (NiFe)\n- `sodio_enxofre` - Sódio-Enxofre (NaS)\n- `zinco_brometo` - Zinco-Brometo (ZnBr)\n- `magnesio` - Magnésio\n- `chumbo_carbono` - Chumbo-Carbono\n- `fluxo_redox` - Fluxo Redox\n- `aluminio_ar` - Alumínio-Ar (Al-Air)\n- `lithium_enxofre` - Lítio-Enxofre (Li-S)\n- `desconhecida` - Tipo de bateria desconhecido\n",
					"parameters": [

					],
					"requestBody": {
						"required": true,
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/AutonomiaNobreakRequest"
								}
							}
						}
					},
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
												"result": null,
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
			},
			"/api/ViabilidadeCFTV": {
				"post": {
					"tags": [
						"Viabilidade de Instalação de CFTV"
					],
					"summary": "Viabilidade de Instalação de CFTV",
					"description": "## Entradas Necessárias\n\nOs seguintes parâmetros devem ser fornecidos no corpo da requisição:\n\n- **tensao_fonte:** Tensão da fonte de alimentação em volts (V).\n- **bitola_cabo:** Bitola do cabo em milímetros quadrados (mm²).\n- **distancia:** Distância entre a fonte e a câmera em metros (m).\n- **tensao_camera:** Tensão mínima necessária para o funcionamento da câmera em volts (V).\n- **corrente_camera:** Corrente consumida pela câmera em amperes (A).\n\n## Valores Válidos para o Campo `bitola_cabo`\n\n- `0` - 26AWG (0.14 mm²)\n- `1` - 24AWG (0.20 mm²)\n- `2` - 22AWG (0.33 mm²)\n- `3` - 20AWG (0.50 mm²)\n- `4` - 17AWG (1.00 mm²)\n- `5` - 15AWG (1.50 mm²)\n- `6` - 13AWG (2.50 mm²)\n- `7` - 11AWG (4.00 mm²)\n",
					"parameters": [

					],
					"requestBody": {
						"required": true,
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/ViabilidadeCFTVRequest"
								}
							}
						}
					},
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
											"message": "Todos os valores devem ser preenchidos: tensao_fonte, bitola_cabo, distancia, tensao_camera, corrente_camera. Por favor, corrija e tente novamente."
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
												"result": null,
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
	}
};