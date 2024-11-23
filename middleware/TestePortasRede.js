const net = require('net');
const dns = require('dns/promises');

/**
 * Testa se uma porta está aberta, fechada ou filtrada.
 * @param {string} host - O endereço IP ou hostname do servidor.
 * @param {number} port - A porta a ser testada.
 * @param {number} timeout - Tempo limite em milissegundos para a conexão (default: 2000ms).
 * @returns {Promise<object>} - Objeto com os detalhes do teste.
 */
async function testPort(host, port, timeout = 2000) {
	const start = Date.now(); // Marca o início do teste.
	const socket = new net.Socket();

	let status = 'fechada'; // Valor padrão.
	return new Promise((resolve) => {
		// Define o tempo limite da conexão.
		socket.setTimeout(timeout);

		// Evento quando a conexão é bem-sucedida.
		socket.on('connect', () => {
			status = 'aberta';
			socket.destroy(); // Fecha o socket após o sucesso.
		});

		// Evento para erros de conexão.
		socket.on('error', (err) => {
			if (err.code === 'ECONNREFUSED') {
				status = 'fechada';
			} else {
				status = 'filtrada';
			}
		});

		// Evento para timeout (porta filtrada ou sem resposta).
		socket.on('timeout', () => {
			status = 'filtrada';
			socket.destroy();
		});

		// Evento ao fechar o socket, resolvendo o status.
		socket.on('close', async () => {
			const end = Date.now(); // Marca o fim do teste.
			resolve({
				host,
				ip: await resolveIp(host),
				port,
				status,
				responseTime: `${end - start}ms`,
			});
		});

		// Tenta conectar à porta e host.
		socket.connect(port, host);
	});
}

/**
 * Resolve o endereço IP de um hostname.
 * @param {string} host - O hostname a ser resolvido.
 * @returns {Promise<string>} - O endereço IP ou 'desconhecido' em caso de falha.
 */
async function resolveIp(host) {
	try {
		const addresses = await dns.lookup(host);
		return addresses.address;
	} catch (err) {
		return 'desconhecido';
	}
}

/**
 * Testa múltiplas portas em um host e retorna os resultados em JSON.
 * @param {string} host - O endereço IP ou hostname do servidor.
 * @param {number[]} ports - Lista de portas a serem testadas.
 * @param {number} timeout - Tempo limite em milissegundos para cada teste.
 * @returns {Promise<object>} - JSON com os resultados dos testes.
 */
async function testMultiplePorts(host, ports, timeout) {
	if (typeof timeout !== 'number' || isNaN(timeout) || timeout <= 0) {
		timeout = 2000; // Valor padrão.
	}
	const results = [];
	for (const port of ports) {
		try {
			const result = await testPort(host, port, timeout);
			results.push(result);
		} catch (error) {
			results.push({
				host,
				ip: 'desconhecido',
				port,
				status: 'erro',
				errorMessage: error.message,
			});
		}
	}
	return {
		host,
		ip: await resolveIp(host),
		testedPorts: ports.length,
		results,
	};
}
/*
// Exemplo de uso:
(async () => {
		const host = 'google.com'; // Substitua pelo IP ou hostname desejado.
		const ports = [80, 443, 22, 8080]; // Lista de portas a serem testadas.
		const timeout = 3000; // Timeout em milissegundos.

		const testResults = await testMultiplePorts(host, ports, timeout);
		console.log(JSON.stringify(testResults, null, 2));
})();
*/
// Exportando as funções
module.exports = {
	testMultiplePorts
};