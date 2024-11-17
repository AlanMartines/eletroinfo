function calculateSubnetIPv4(ipAddress, subnetMask) {

	const ipParts = ipAddress.split('.').map(part => parseInt(part));
	const maskParts = subnetMaskToDottedDecimal(subnetMask);

	const networkAddressParts = ipParts.map((part, index) => part & maskParts[index]);
	const broadcastAddressParts = ipParts.map((part, index) => part | (~maskParts[index] & 255));

	const networkAddress = networkAddressParts.join('.');
	const broadcastAddress = broadcastAddressParts.join('.');

	const cidr = subnetMask.startsWith('/') ? parseInt(subnetMask.slice(1)) : subnetMaskToCIDR(subnetMask);
	const totalHosts = Math.pow(2, 32 - cidr);
	const usableHosts = totalHosts - 2;

	// Corrige o cálculo do Usable IP Range
	const usableIPRange =
		usableHosts > 0
			? `${networkAddressParts.join('.').replace(/\d+$/, networkAddressParts[3] + 1)} - ${broadcastAddressParts
				.join('.')
				.replace(/\d+$/, broadcastAddressParts[3] - 1)}`
			: "N/A";

	// Additional features
	const dottedDecimalMask = maskParts.join('.');
	const subnetMaskBinary = subnetMaskToBinary(dottedDecimalMask);
	const ipClass = calculateIPClass(cidr);
	const wildcardMask = calculateWildcardMask(dottedDecimalMask);
	const ipType = calculateIPType(ipParts);

	return {
		ipAddress: ipAddress,
		networkAddress: networkAddress,
		broadcastAddress: broadcastAddress,
		usableIPRange: usableIPRange,
		totalHosts: totalHosts,
		usableHosts: usableHosts,
		binarySubnetMask: subnetMaskBinary,
		ipClass: ipClass,
		wildcardMask: wildcardMask,
		subnetMask: dottedDecimalMask,
		cidrNotation: `/${cidr}`,
		ipType: ipType,
	};
}

function subnetMaskToCIDR(mask) {
	return mask.split('.').reduce((cidr, octet) => cidr + (parseInt(octet).toString(2).match(/1/g) || []).length, 0);
}

function subnetMaskToBinary(mask) {
	return mask.split('.').map(part => parseInt(part).toString(2).padStart(8, '0')).join('.');
}

function calculateIPClass(cidr) {
	if (cidr >= 8 && cidr <= 15) {
			return 'A';
	} else if (cidr >= 16 && cidr <= 23) {
			return 'B';
	} else if (cidr >= 24 && cidr <= 32) {
			return 'C';
	} else {
			return 'Other';
	}
}

function calculateWildcardMask(subnetMask) {
	const maskParts = subnetMask.split('.').map(part => parseInt(part));
	const wildcardParts = maskParts.map(part => 255 - part);
	return wildcardParts.join('.');
}

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

function subnetMaskToDottedDecimal(mask) {
	if (mask.startsWith('/')) {
		const cidr = parseInt(mask.slice(1));
		let binaryMask = ''.padStart(cidr, '1').padEnd(32, '0');
		return binaryMask.match(/.{8}/g).map(bin => parseInt(bin, 2));
	}
	return mask.split('.').map(octet => parseInt(octet));
}

/*
// Exemplo de uso:
const ipAddress = "192.168.0.1";
const subnetMask = "/24";

try {
	const result = calculateSubnetIPv4(ipAddress, subnetMask);
	console.log(result);
} catch (error) {
	console.error(error.message);
}
*/

// Exportando as funções
module.exports = {
	calculateSubnetIPv4
};