const IP = require('../function/ip.js');
const Network = require('../function/network.js');


// Determina se o IP é público ou privado
function calculateIPType(ipAddress) {
	const ipParts = ipAddress.split('.').map(part => parseInt(part, 10)); // Converte para array de inteiros
	const privateRanges = [
			['10.0.0.0', '10.255.255.255'],
			['172.16.0.0', '172.31.255.255'],
			['192.168.0.0', '192.168.255.255']
	];

	for (const [start, end] of privateRanges) {
			const startIP = start.split('.').map(part => parseInt(part, 10));
			const endIP = end.split('.').map(part => parseInt(part, 10));
			const inRange = ipParts.every((part, index) => part >= startIP[index] && part <= endIP[index]);
			if (inRange) {
					return 'Private';
			}
	}
	return 'Public';
}

/*
 * Calcula informações detalhadas sobre um IP e sua rede a partir de uma entrada de dados.
 */
function calculateIPInfo(ipAddress, subnetMask) {

	const prefix = parseInt(subnetMask.replace('/', ''), 10); // Remove '/' da máscara
	const network = new Network(ipAddress, prefix);


	if (network.version === 4) {
		const wildcardMask = IPv4Wildcard(network.getMask());
		let ipType = calculateIPType(network.address);
		return {
			ipAddress: ipAddress,
			networkAddress: network.getNetwork(),
			usableIPRange: `${network.hostFirst()} - ${network.hostLast()}`,
			broadcastAddress: network.getBroadcast(),
			totalHosts: parseInt(network.networkSize().toString()).toLocaleString(),
			usableHosts: (parseInt(network.networkSize().toString()) - 2).toLocaleString(),
			subnetMask: network.getMask(),
			wildcardMask: wildcardMask,
			binarySubnetMask: subnetMaskToBinary(network.getMask()),
			ipClass: getIPv4Class(network.address),
			cidrNotation: subnetMask,
			ipType: network.printInfo(),
			shortIp: `${ipAddress}${subnetMask}`
		};
	} else {
		return {
			ipAddress: ipAddress,
			ipAddressFull: network.toDottedNotation(network.toInteger()),
			networkAddress: network.toCompressed(network.getNetwork(), network.version),
			usableIPRange: `${network.toDottedNotation(network.networkToInteger())} - ${network.toDottedNotation(network.broadcastToLong())}`,
			totalHosts: parseInt(network.networkSize().toString()).toLocaleString(),
			cidrNotation: subnetMask,
			shortIp: `${ipAddress}${subnetMask}`
	};
	}
}

/*
 * Converte uma máscara de sub-rede em formato decimal para binário.
 */
function subnetMaskToBinary(subnetMask) {
	return subnetMask
		.split('.')
		.map(octet => parseInt(octet, 10).toString(2).padStart(8, '0'))
		.join('.');
}

/*
 * Determina a máscara curinga (wildcard) a partir da máscara de sub-rede.
 */
function IPv4Wildcard(subnetMask) {
	return subnetMask
		.split('.')
		.map(octet => 255 - parseInt(octet, 10))
		.join('.');
}

/*
 * Determina a classe de um endereço IPv4. A classe do IP ("A", "B", "C", "D" ou "E")
 */
function getIPv4Class(ipAddress) {
	const firstOctet = parseInt(ipAddress.split('.')[0], 10);
	if (firstOctet >= 1 && firstOctet <= 126) return 'A';
	if (firstOctet >= 128 && firstOctet <= 191) return 'B';
	if (firstOctet >= 192 && firstOctet <= 223) return 'C';
	if (firstOctet >= 224 && firstOctet <= 239) return 'D';
	return 'E';
}

// Exportando as funções
module.exports = {
	calculateIPInfo
};
