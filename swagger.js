require('dotenv').config();
const config = require('./config.global');
if (config.DOMAIN_SSL) {
	var serverURL = `https://${config.DOMAIN_SSL}`;
} else {
	var serverURL = `http://${config.HOST}:${config.PORT}`;
}
//
module.exports = {
	"openapi":"3.0.3",
	"info":{
		 "description":"EletroInfo :: Eletro Informática - Para assegurar a excelência dos nossos serviços, a Eletroinfo continua a explorar e adotar constantemente inovações tecnológicas, com o objetivo primordial de satisfazer plenamente os nossos clientes.",
		 "version":"1.0.0",
		 "title":"API - Eletro Info"
	},
	"tags":[
		 {
				"name":"Cálculo de Autonomia de Nobreak",
				"description":"Endpoint para calcular a autonomia de um nobreak."
		 },
		 {
				"name":"Viabilidade de Instalação de CFTV",
				"description":"Endpoint para verificar a viabilidade de instalação de sistemas de CFTV."
		 },
		 {
				"name":"Consulta de IP",
				"description":"Endpoint para retornar informações básicas sobre um endereço IP, como tipo, localização e provedor."
		 },
		 {
				"name":"Calculadora de IP (IPv4)",
				"description":"Endpoint para calcular sub-redes IPv4, fornecendo informações como máscara de rede, IP inicial e final, e quantidade de hosts disponíveis."
		 },
		 {
				"name":"Calculadora de IP (IPv6)",
				"description":"Endpoint para calcular sub-redes IPv6, fornecendo informações como máscara de rede, IP inicial e final, e quantidade de hosts disponíveis."
		 },
		 {
				"name":"Geolocalização de IP",
				"description":"Endpoint para determinar a localização aproximada de um endereço IP, incluindo país, cidade e provedor de internet."
		 },
		 {
				"name":"Teste de Portas de Rede",
				"description":"Endpoint para verificar a abertura ou bloqueio de portas específicas em uma rede, útil para diagnósticos de conexão."
		 },
		 {
				"name":"Consulta de Fabricante de MAC",
				"description":"Endpoint para identificar o fabricante de um dispositivo com base no endereço MAC fornecido."
		 },
		 {
				"name":"Calculadora de Transferência de Dados",
				"description":"Endpoint para calcular o tempo estimado de transferência de dados com base no tamanho do arquivo e na velocidade de conexão."
		 },
		 {
				"name":"Cálculo de Latência e Largura de Banda",
				"description":"Endpoint para calcular a performance da sua memória RAM com precisão, usando nossa calculadora de latência e largura de banda."
		 },
		 {
				"name":"Calculadora de Metabolismo Basal (TMB)",
				"description":"Endpoint para calcular o metabolismo basal de uma pessoa com base em dados como idade, peso, altura e gênero."
		 }
	],
	"servers":[
		 {
				"url":`${serverURL}`,
				"description":""
		 }
	],
	"components":{
		 "schemas":{
				
		 }
	},
	"paths":{
		 "/api/Start":{
				"post":{
					 "tags":[
							"Cálculo de Autonomia de Nobreak"
					 ],
					 "summary":"Iniciar sessão",
					 "description":"Comando que inicia a sessão.",
					 "requestBody":{
							"required":true,
							"content":{
								 "multipart/form-data":{
										"schema":{
											 "type":"object",
											 "properties":{
													"SessionName":{
														 "description":"Informe o nome da sessão",
														 "type":"string",
														 "default":""
													}
											 },
											 "required":[
													"SessionName"
											 ]
										}
								 },
								 "application/json":{
										"schema":{
											 "type":"object",
											 "properties":{
													"SessionName":{
														 "type":"string",
														 "default":"Informe o nome da sessão aqui"
													}
											 },
											 "required":[
													"SessionName"
											 ]
										}
								 }
							}
					 },
					 "security":[
							{
								 
							}
					 ],
					 "responses":{
							"200":{
								 "description":"",
								 "content":{
										"application/json":{
											 "schema":{
													"type":"object",
													"example":{
														 "Status":{
																"error":false,
																"status":200,
																"message":"Sistema iniciado e disponivel para uso"
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