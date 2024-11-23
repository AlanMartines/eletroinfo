const net = require('net');

function testPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status = 'fechada'; // Valor padrão, caso nenhum evento seja emitido.

        // Define timeout para evitar travamento em caso de portas filtradas.
        socket.setTimeout(2000);

        // Evento quando a conexão for bem-sucedida.
        socket.on('connect', () => {
            status = 'aberta';
            socket.destroy(); // Fecha o socket.
        });

        // Evento para erro na conexão (porta fechada ou bloqueada).
        socket.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                status = 'fechada';
            } else {
                status = 'filtrada';
            }
        });

        // Timeout para portas filtradas ou sem resposta.
        socket.on('timeout', () => {
            status = 'filtrada';
            socket.destroy(); // Fecha o socket.
        });

        // Evento quando o socket é fechado.
        socket.on('close', () => {
            resolve(status);
        });

        // Tenta se conectar ao host e porta especificados.
        socket.connect(port, host);
    });
}
/*
// Exemplo de uso:
(async () => {
    const host = 'google.com'; // Alterar para o IP ou hostname desejado.
    const port = 80;          // Alterar para a porta desejada.
    
    console.log(`Testando ${host}:${port}...`);
    const result = await testPort(host, port);
    console.log(`Porta ${port} está ${result}.`);
})();
*/
// Exportando as funções
module.exports = {
	testPort
};