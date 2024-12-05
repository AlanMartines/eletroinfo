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
				"name": "Calculadora de IP (IPv4)",
				"description": "Realiza cálculos de sub-redes IPv4, exibindo detalhes como máscara de rede, IP inicial e final, além da quantidade de hosts disponíveis."
			},
			{
				"name": "Calculadora de IP (IPv6)",
				"description": "Calcula sub-redes IPv6, gerando informações como prefixo de rede, IP inicial e final, e o total de endereços disponíveis na sub-rede."
			},
			{
				"name": "Consulta de IP",
				"description": "Fornece informações detalhadas sobre um endereço IP, como tipo (IPv4/IPv6), localização aproximada e provedor de internet."
			},
			{
				"name": "Geolocalização de IP",
				"description": "Localiza geograficamente um endereço IP, como tipo (IPv4/IPv6), fornecendo informações como país, cidade e provedor associado ao endereço."
			},
			{
				"name": "Teste de Portas de Rede",
				"description": "Verifica a disponibilidade ou bloqueio de portas específicas em uma rede, auxiliando no diagnóstico de problemas de conectividade."
			},
			{
				"name": "Consulta Fabricante pelo Endereço MAC",
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
				},

				"CalculadoraIPv4Request": {
					"type": "object",
					"properties": {
						"ipAddress": {
							"type": "string",
							"description": "Representa o endereço IP que será analisado.",
							"example": "192.168.100.1"
						},
						"subnetMask": {
							"type": "string",
							"description": "Deve ser informado no formato CIDR (ex.: /22) (ex.: 255.255.252.0).",
							"example": "/22"
						}
					}
				},

				"CalculadoraIPv6Request": {
					"type": "object",
					"properties": {
						"ipAddress": {
							"type": "string",
							"description": "Representa o endereço IP que será analisado.",
							"example": "2a02:4780:14:5a20::1"
						},
						"subnetMask": {
							"type": "string",
							"description": "Deve ser informado no formato CIDR (ex.: /64).",
							"example": "/64"
						}
					}
				},

				"ConsultaIPRequest": {
					"type": "object",
					"properties": {
						"ip": {
							"type": "string",
							"description": "Endereço IP que se deseja consultar (opcional). Se vazio, retorna informações sobre o IP público atual",
							"example": "200.221.11.100"
						}
					}
				},

				"GeolocalizacaoIPRequest": {
					"type": "object",
					"properties": {
						"ip": {
							"type": "string",
							"description": "Endereço IP que se deseja consultar.",
							"example": "200.221.11.100"
						}
					}
				},

				"TestePortasRedeRequest": {
					"type": "object",
					"properties": {
						"host": {
							"type": "string",
							"description": "O endereço IP ou hostname do servidor.",
							"example": "google.com.br"
						},
						"port": {
							"type": "array",
							"description": "A porta a ser testada.",
							"example": [80, 443, 53]
						},
						"timeout": {
							"type": "integer",
							"description": "Tempo limite em milissegundos para a conexão.",
							"example": 2000
						}
					}
				},

				"ConsultaFabricanteMACRequest": {
					"type": "object",
					"properties": {
						"macadress": {
							"type": "string",
							"description": "Endereço MAC que se deseja consultar, retorna informações sobre endereço MAC informado",
							"example": "00-1A-2B-3C-4D-5E"
						}
					}
				},

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
												"message": "JSON enviado está incorreto. Por favor, revise o formato e tente novamente."
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
												"resistencia_metro": "0.010",
												"resistencia_total": "1.34",
												"tensao_fornecida": "10.79",
												"distancia_maxima": "66.67",
												"viavel": false
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
												"message": "JSON enviado está incorreto. Por favor, revise o formato e tente novamente."
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
											"message": "Erro ao calcular a viabilidade."
										}
									}
								}
							}
						}

					}
				}
			},

			"/api/CalculadoraIPv4": {
				"post": {
					"tags": [
						"Calculadora de IP (IPv4)"
					],
					"summary": "Calculadora de IP (IPv4)",
					"description": "## Entradas Necessárias\n\nOs seguintes parâmetros devem ser enviados no corpo da requisição:\n\n- **ipAddress**: Representa o endereço IP que será analisado.\n- **subnetMask**: Deve ser informado no formato CIDR (ex.: /22) (ex.: 255.255.252.0).\n\n# Valores Válidos para o Campo `subnetMask`\n\nOs valores de prefixo CIDR (`/n`) e suas correspondentes máscaras de rede (Network Mask) são os seguintes:\n\n- `/1` - 128.0.0.0\n- `/2` - 192.0.0.0\n- `/3` - 224.0.0.0\n- `/4` - 240.0.0.0\n- `/5` - 248.0.0.0\n- `/6` - 252.0.0.0\n- `/7` - 254.0.0.0\n\n### Classe A\n\n- `/8` - 255.0.0.0\n- `/9` - 255.128.0.0\n- `/10` - 255.192.0.0\n- `/11` - 255.224.0.0\n- `/12` - 255.240.0.0\n- `/13` - 255.248.0.0\n- `/14` - 255.252.0.0\n- `/15` - 255.254.0.0\n\n### Classe B\n\n- `/16` - 255.255.0.0\n- `/17` - 255.255.128.0\n- `/18` - 255.255.192.0\n- `/19` - 255.255.224.0\n- `/20` - 255.255.240.0\n- `/21` - 255.255.248.0\n- `/22` - 255.255.252.0\n- `/23` - 255.255.254.0\n\n### Classe C\n\n- `/24` - 255.255.255.0\n- `/25` - 255.255.255.128\n- `/26` - 255.255.255.192\n- `/27` - 255.255.255.224\n- `/28` - 255.255.255.240\n- `/29` - 255.255.255.248\n- `/30` - 255.255.255.252\n- `/31` - 255.255.255.254\n- `/32` - 255.255.255.255\n\nCertifique-se de usar o prefixo CIDR correto conforme a necessidade de cálculo de rede.\n",
					"parameters": [

					],
					"requestBody": {
						"required": true,
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/CalculadoraIPv4Request"
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
												"ipAddress": "192.168.100.1",
												"networkAddress": "192.168.100.0",
												"usableIPRange": "192.168.100.1 - 192.168.103.254",
												"broadcastAddress": "192.168.103.255",
												"totalHosts": "1.022",
												"usableHosts": "1.020",
												"subnetMask": "255.255.252.0",
												"wildcardMask": "0.0.3.255",
												"binarySubnetMask": "11111111.11111111.11111100.00000000",
												"ipClass": "C",
												"cidrNotation": "/22",
												"ipType": "Private Use",
												"shortIp": "192.168.100.1/22"
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
											"message": "Todos os valores devem ser preenchidos: ipAddress, subnetMask. Por favor, corrija e tente novamente."
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
												"message": "JSON enviado está incorreto. Por favor, revise o formato e tente novamente."
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
											"message": "Prefixo inválido | Por favor, insira um endereço IP válido | Um endereço IP não pode ser maior que 2 elevado à potência de 128, nem ser um número negativo."
										}
									}
								}
							}
						}

					}
				}
			},
			
			"/api/CalculadoraIPv6": {
				"post": {
					"tags": [
						"Calculadora de IP (IPv6)"
					],
					"summary": "Calculadora de IP (IPv6)",
					"description": "## Entradas Necessárias\n\nOs seguintes parâmetros devem ser enviados no corpo da requisição:\n\n- **ipAddress**: Representa o endereço IP que será analisado.\n- **subnetMask**: Deve ser informado no formato CIDR (ex.: /64).\n\n# Valores Válidos para o Campo `subnetMask`\n\nOs valores de prefixo CIDR (`/n`) e suas correspondentes máscaras de rede (Network Mask) são de `/1` ... `/128`.\n\nCertifique-se de usar o prefixo CIDR correto conforme a necessidade de cálculo de rede.\n",
					"parameters": [

					],
					"requestBody": {
						"required": true,
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/CalculadoraIPv6Request"
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
												"ipAddress": "2a02:4780:14:5a20::1",
												"ipAddressFull": "2a02:4780:0014:5a20:0000:0000:0000:0001",
												"networkAddress": "2a02:4780:14:5a20::",
												"usableIPRange": "2a02:4780:0014:5a20:0000:0000:0000:0000 - 2a02:4780:0014:5a20:ffff:ffff:ffff:ffff",
												"totalHosts": "18.446.744.073.709.552.000",
												"cidrNotation": "/64",
												"shortIp": "2a02:4780:14:5a20::1/64"
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
											"message": "Todos os valores devem ser preenchidos: ipAddress, subnetMask. Por favor, corrija e tente novamente."
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
												"message": "JSON enviado está incorreto. Por favor, revise o formato e tente novamente."
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
											"message": "Prefixo inválido | Por favor, insira um endereço IP válido | Um endereço IP não pode ser maior que 2 elevado à potência de 128, nem ser um número negativo."
										}
									}
								}
							}
						}

					}
				}
			},

			"/api/ConsultaIP": {
				"post": {
					"tags": [
						"Consulta de IP"
					],
					"summary": "Consulta de IP",
					"description": "## Entradas Necessárias\n\nOs seguintes parâmetros devem ser enviados no corpo da requisição:\n\n- **ip:** Endereço IP que se deseja consultar (opcional). Se vazio, retorna informações sobre o IP público atual.\n",
					"parameters": [

					],
					"requestBody": {
						"required": true,
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/ConsultaIPRequest"
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
												"timezone": "America/Sao_Paulo",
												"organization": "AS7162 Universo Online S.A.",
												"ip": "200.221.11.100",
												"asn": 7162,
												"area_code": "0",
												"organization_name": "Universo Online S.A.",
												"country_code": "BR",
												"country_code3": "BRA",
												"continent_code": "SA",
												"country": "Brazil",
												"latitude": "-22.8305",
												"longitude": "-43.2192",
												"accuracy": 1000
											},
											"message": "Consulta realizada com sucesso."
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
												"message": "JSON enviado está incorreto. Por favor, revise o formato e tente novamente."
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
											"message": "Endereço IP inválido ou não encontrado."
										}
									}
								}
							}
						}

					}
				}
			},

			"/api/GeolocalizacaoIP": {
				"post": {
					"tags": [
						"Geolocalização de IP"
					],
					"summary": "Geolocalização de IP",
					"description": "## Entradas Necessárias\n\nOs seguintes parâmetros devem ser enviados no corpo da requisição:\n\n- **ip:** Endereço IP que se deseja consultar.\n",
					"parameters": [

					],
					"requestBody": {
						"required": true,
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/GeolocalizacaoIPRequest"
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
												"query": "2a02:4780:14:5a20::1",
												"status": "success",
												"continent": "América do Sul",
												"continentCode": "SA",
												"country": "Brasil",
												"countryCode": "BR",
												"region": "SP",
												"regionName": "São Paulo",
												"city": "São Paulo",
												"district": "",
												"zip": "01323",
												"lat": -23.5335,
												"lon": -46.6359,
												"timezone": "America/Sao_Paulo",
												"offset": -10800,
												"currency": "BRL",
												"isp": "HOSTINGER BR",
												"org": "Hostinger International Ltd.",
												"as": "AS47583 Hostinger International Limited",
												"asname": "AS-HOSTINGER",
												"reverse": "",
												"mobile": false,
												"proxy": false,
												"hosting": true
											},
											"message": "Consulta realizada com sucesso."
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
											"message": "O ip deve ser preenchido. Por favor, corrija e tente novamente."
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
												"message": "JSON enviado está incorreto. Por favor, revise o formato e tente novamente."
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
											"message": "Endereço IP inválido ou não encontrado."
										}
									}
								}
							}
						}

					}
				}
			},

			"/api/TestePortasRede": {
				"post": {
					"tags": [
						"Teste de Portas de Rede"
					],
					"summary": "Teste de Portas de Rede",
					"description": "## Entradas Necessárias\n\nOs seguintes parâmetros devem ser enviados no corpo da requisição:\n\n- **host:** Endereço IP ou hostname que se deseja consultar.\n- **port:** Lista de portas a serem testadas.\n- **timeout:** Timeout em milissegundos.\n",
					"parameters": [

					],
					"requestBody": {
						"required": true,
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/TestePortasRedeRequest"
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
												"host": "google.com.br",
												"ip": "142.250.184.195",
												"testedPorts": 3,
												"results": [
													{
														"host": "google.com.br",
														"ip": "142.250.184.195",
														"port": 80,
														"status": "aberta",
														"responseTime": "18ms"
													},
													{
														"host": "google.com.br",
														"ip": "142.250.184.195",
														"port": 443,
														"status": "aberta",
														"responseTime": "27ms"
													},
													{
														"host": "google.com.br",
														"ip": "142.250.184.195",
														"port": 53,
														"status": "filtrada",
														"responseTime": "2239ms"
													}
												]
											},
											"message": "Teste realizado com sucesso."
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
											"message": "Todos os valores devem ser preenchidos: host, port, timeout. Por favor, corrija e tente novamente."
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
												"message": "JSON enviado está incorreto. Por favor, revise o formato e tente novamente."
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
											"message": "Erro ao realizar o teste"
										}
									}
								}
							}
						}

					}
				}
			},

			"/api/ConsultaFabricanteMAC": {
				"post": {
					"tags": [
						"Consulta Fabricante pelo Endereço MAC"
					],
					"summary": "Consulta Fabricante pelo Endereço MAC",
					"description": "## Entradas Necessárias\n\nOs seguinte parâmetro deve ser enviado no corpo da requisição:\n\n- **macadress:** Endereço MAC que se deseja consultar.\n",
					"parameters": [

					],
					"requestBody": {
						"required": true,
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/ConsultaIPRequest"
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
												"timezone": "America/Sao_Paulo",
												"organization": "AS7162 Universo Online S.A.",
												"ip": "200.221.11.100",
												"asn": 7162,
												"area_code": "0",
												"organization_name": "Universo Online S.A.",
												"country_code": "BR",
												"country_code3": "BRA",
												"continent_code": "SA",
												"country": "Brazil",
												"latitude": "-22.8305",
												"longitude": "-43.2192",
												"accuracy": 1000
											},
											"message": "Consulta realizada com sucesso."
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
												"message": "JSON enviado está incorreto. Por favor, revise o formato e tente novamente."
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
											"message": "Endereço IP inválido ou não encontrado."
										}
									}
								}
							}
						}

					}
				}
			},

		}
	}
};