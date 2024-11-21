require('dotenv').config();
const config = require('./config.global');

const serverURL = config.DOMAIN_SSL
	? `https://${config.DOMAIN_SSL}`
	: `http://${config.HOST}:${config.PORT}`;

module.exports = {
	definition: {
		openapi: "3.0.3",
		info: {
			description: "EletroInfo API - Documentação",
			version: "1.0.0",
			title: "API - Eletro Info"
		},
		servers: [
			{
				url: serverURL,
				description: "Servidor principal"
			}
		],
		paths: {
			"/api/AutonomiaNobreak": {
				post: {
					tags: ["Cálculo de Autonomia de Nobreak"],
					summary: "Cálculo de Autonomia de Nobreak",
					description: "Calcula a autonomia de um nobreak com base nos parâmetros fornecidos.",
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										carga_aplicada: { type: "integer", example: 100 },
										tensao_bateria: { type: "integer", example: 12 },
										capacidade_bateria: { type: "integer", example: 7 },
										quantidade_baterias: { type: "integer", example: 2 },
										tipo_bateria: { type: "string", example: "chumbo_acido" }
									},
									required: [
										"carga_aplicada",
										"tensao_bateria",
										"capacidade_bateria",
										"quantidade_baterias",
										"tipo_bateria"
									]
								},
								examples: {
									exemploSimples: {
										summary: "Exemplo de cálculo",
										value: {
											carga_aplicada: 100,
											tensao_bateria: 12,
											capacidade_bateria: 7,
											quantidade_baterias: 2,
											tipo_bateria: "chumbo_acido"
										}
									}
								}
							}
						}
					},
					responses: {
						"200": {
							description: "Cálculo realizado com sucesso.",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											error: { type: "boolean", example: false },
											status: { type: "integer", example: 200 },
											result: {
												type: "object",
												properties: {
													tensaocorte: { type: "number", example: 19.8 },
													autonomia: { type: "string", example: "09:25:04" }
												}
											},
											message: { type: "string", example: "Cálculo realizado com sucesso." }
										}
									}
								}
							}
						},
						"400": {
							description: "Erro de validação",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											error: { type: "boolean", example: true },
											status: { type: "integer", example: 400 },
											message: { type: "string", example: "Todos os valores devem ser preenchidos." }
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
