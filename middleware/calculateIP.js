const IP = require('../function/ip.js');
const Network = require('../function/network.js');

/**
 * Calcula informações detalhadas sobre um IP e sua rede a partir de uma entrada de dados.
 * 
 * @param {string} ipAddress - Endereço IP (ex.: "192.168.100.1").
 * @param {string} subnetMask - Máscara de sub-rede no formato CIDR (ex.: "/24").
 * @returns {object} Informações detalhadas sobre o IP e a rede.
 */
function calculateIPInfo(ipAddress, subnetMask) {

	const prefix = parseInt(subnetMask.replace('/', ''), 10); // Remove '/' da máscara
	const network = new Network(ipAddress, prefix);

	// Determina se o IP é público ou privado
	function calculateIPType(ipParts) {
		const privateRanges = [
			['10.0.0.0', '10.255.255.255'],
			['172.16.0.0', '172.31.255.255'],
			['192.168.0.0', '192.168.255.255']
		];

		for (const [start, end] of privateRanges) {
			const startIP = start.split('.').map(part => parseInt(part));
			const endIP = end.split('.').map(part => parseInt(part));
			const inRange = ipParts.every((part, index) => part >= startIP[index] && part <= endIP[index]);
			if (inRange) {
				return 'Private';
			}
		}
		return 'Public';
	}

	if (network.version === 4) {
		const wildcardMask = IPv4Wildcard(network.getMask());
		return {
			ipAddress: network.address,
			networkAddress: network.getNetwork(),
			usableIPRange: `${network.hostFirst()} - ${network.hostLast()}`,
			broadcastAddress: network.getBroadcast(),
			totalHosts: parseInt(network.networkSize().toString()),
			usableHosts: parseInt(network.networkSize().toString()) - 2,
			subnetMask: network.getMask(),
			wildcardMask: wildcardMask,
			binarySubnetMask: subnetMaskToBinary(network.getMask()),
			ipClass: getIPv4Class(network.address),
			cidrNotation: subnetMask,
			ipType: calculateIPType(ipAddress),
			shortIp: `${ipAddress}/${subnetMask}`
		};
	} else {
		return {
			ipAddress: network.address,
			ipAddressFull: network.toDottedNotation(network.toInteger()),
			networkAddress: network.getNetwork(),
			usableIPRange: `${network.hostFirst()} - ${network.hostLast()}`,
			totalHosts: network.networkSize().toString(),
			cidrNotation: subnetMask,
			shortIp: `${network.address}${subnetMask}`
		};
	}
}

/**
 * Converte uma máscara de sub-rede em formato decimal para binário.
 *
 * @param {string} subnetMask - A máscara de sub-rede em formato decimal (ex.: "255.255.255.0").
 * @returns {string} A máscara de sub-rede em formato binário (ex.: "11111111.11111111.11111111.00000000").
 */
function subnetMaskToBinary(subnetMask) {
	return subnetMask
		.split('.')
		.map(octet => parseInt(octet, 10).toString(2).padStart(8, '0'))
		.join('.');
}

/**
 * Determina a máscara curinga (wildcard) a partir da máscara de sub-rede.
 *
 * @param {string} subnetMask - A máscara de sub-rede em formato decimal.
 * @returns {string} A máscara curinga em formato decimal.
 */
function IPv4Wildcard(subnetMask) {
	return subnetMask
		.split('.')
		.map(octet => 255 - parseInt(octet, 10))
		.join('.');
}

/**
 * Determina a classe de um endereço IPv4.
 *
 * @param {string} ipAddress - O endereço IPv4.
 * @returns {string} A classe do IP ("A", "B", "C", "D" ou "E").
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
