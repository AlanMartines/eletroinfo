//
const { exec } = require('child_process');
const express = require('express');
require('express-async-errors');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const http = require('http').Server(app);
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const yaml = require('js-yaml');
const config = require('./config.global');
const { logger } = require('./utils/logger');
const eletroinfo = require("./engines/eletroinfo");
const swaggerFile = require('./swagger.js');
const yamlSpec = yaml.dump(swaggerFile);
// https://www.scaleway.com/en/docs/tutorials/socket-io/
const io = require('socket.io')(http, {
	cors: {
		origins: ["*"],
		methods: ["GET", "POST"],
		transports: ['websocket', 'polling'],
		credentials: true
	},
	allowEIO3: true
});
io.setMaxListeners(0);
//
const {
	yo
} = require('yoo-hoo');
//
yo('Eletro Info', {
	color: 'rainbow',
	spacing: 1,
});
//
// ------------------------------------------------------------------------------------------------//
//
// Função para executar o comando swagger-codegen-cli
async function generateSwaggerCode() {
	try {
		const command = 'java -jar swagger-codegen-cli.jar generate -i swagger.yaml -o swaggerCodegen -l nodejs-server';

		exec(command, (error, stdout, stderr) => {
			if (error) {
				logger.error(`- Erro ao executar o comando: ${error.message}`);
				return;
			}
			if (stderr) {
				logger.error(`- Erro: ${stderr}`);
				return;
			}
			logger.info(`- Resultado: ${stdout}`);
		});
	} catch (error) {
		logger.error(`- Erro: ${error}`);
	}
}
//
// ------------------------------------------------------------------------------------------------//
//
try {
	//
	// Body Parser
	app.use(cors());
	app.use(bodyParser.json({
		limit: '128mb',
		type: 'application/json'
	}));
	//
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	//
	// Express Parser
	app.use(express.json({
		limit: '128mb',
		extended: true
	}));
	//
	app.use(express.urlencoded({
		limit: '128mb',
		extended: true,
		parameterLimit: 50000
	}));
	//
	app.use((err, req, res, next) => {
		//
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With');
		//
		if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
			//
			if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
				//
				//console.error(err);
				res.setHeader('Content-Type', 'application/json');
				return res.status(404).json({
					"Status": {
						"error": true,
						"status": 404,
						"message": "Json gerado de forma incorreta, efetue a correção e tente novamente"
					}
				});
			}
			//
		}
		//
		next();
	});
	//
	app.use(async (req, res, next) => {
		req.io = io;
		var _send = res.send;
		var sent = false;
		res.send = (data) => {
			if (sent) return;
			_send.bind(res)(data);
			sent = true;
		};
		next();
	});
	//
	// Verifique se o arquivo swagger.yaml já existe e remova-o antes de criar um novo
	fs.pathExists('./swagger.yaml').then(async (exists) => {
		if (exists) {
			return fs.remove('./swagger.yaml');
		}
	}).then(async () => {
		//const yamlSpec = yaml.dump(swaggerFile);
		return fs.writeFile('./swagger.yaml', yamlSpec, 'utf8');
	}).then(async () => {
		// Chame a função para gerar o código
		logger.info(`- Arquivo swagger.yaml criado com sucesso`);
		//await generateSwaggerCode();
		//
	}).catch(async (err) => {
		logger.error(`- Erro ao criar o arquivo swagger.yaml: ${err.message}`);
	});
	//
	const swaggerOptions = {
		definition: {
			openapi: '3.0.3',
			info: {
				title: 'API Eletro Info',
				version: '1.0.0',
				description: 'Documentação da API Eletro Info',
			}
		},
		apis: ['./routes/*.js'], // Caminho onde estão as rotas documentadas
	};
	//
	// Rotas
	const swaggerSpec = swaggerJsdoc(swaggerOptions);
	app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
	//app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
	app.use("/api", eletroinfo);
	//
	const sockets = {};
	//socket
	//
	//cria um callback para quando alguém conectar
	io.on('connection', (socket) => {
		//adiciona todas os id's do socket na variavel sockets
		sockets[socket.id] = socket;
		logger?.info('- Abriu conexão');
		logger?.info(`- Socketid ${socket.id}`);
	});
	//
	//socket
	io.on('connection', (socket) => {
		socket.on('disconnect', function () {
			logger?.info('- Fechou conexão');
			logger?.info(`- Socketid ${socket.id}`);
		});
	});
	//
	http.listen(config.PORT, config.HOST, async function (err) {
		if (err) {
			logger?.error(err);
		} else {
			const host = http.address().address;
			const port = http.address().port;
			if (config.DOMAIN_SSL) {
				logger?.info(`- HTTP Server running on`);
				logger?.info(`- To status: https://${config.DOMAIN_SSL}/`);
				logger?.info(`- To doc: https://${config.DOMAIN_SSL}/docs`);
			} else {
				logger?.info(`- HTTP Server running on`);
				logger?.info(`- To status: http://${config.HOST}:${config.PORT}/`);
				logger?.info(`- To doc: http://${config.HOST}:${config.PORT}/docs`);
			}
			//
		}
		//
		logger?.info('=====================================================================================================');
		//
	});
	//
	//
} catch (erro) {
	logger?.error('- Não foi fossivel iniciar o sistema');
	logger?.error(erro);
	process.exit(1);
}
//
process.stdin.resume(); //so the program will not close instantly
//
async function exitHandler(options, exitCode) {
	if (options.cleanup) {
		logger?.info("- Cleanup");
	}
	if (exitCode || exitCode === 0) {
		logger?.info(exitCode);
	}
	//
	if (options.exit) {
		process.exit();
	}
} //exitHandler
//
// ------------------------------------------------------------------------------------------------//
//
//
//do something when sistema is closing
process.on('exit', exitHandler.bind(null, {
	cleanup: true
}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
	exit: true
}));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {
	exit: true
}));
process.on('SIGUSR2', exitHandler.bind(null, {
	exit: true
}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
	exit: true
}));
//