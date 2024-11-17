function calculateSubnetIPv4(ipAddress, subnetMask) {
	if (!validateIPv4(ipAddress)) {
			throw new Error("Endereço IPv4 inválido.");
	}

	const ipParts = ipAddress.split('.').map(part => parseInt(part));
	const maskParts = subnetMaskToDottedDecimal(subnetMask);

	if (!maskParts || maskParts.length !== 4) {
			throw new Error("Máscara de sub-rede inválida.");
	}

	// Cálculo do endereço de rede
	const networkAddressParts = ipParts.map((part, index) => part & maskParts[index]);
	const networkAddress = networkAddressParts.join('.');

	// Cálculo do endereço de broadcast
	const broadcastAddressParts = ipParts.map((part, index) => part | (~maskParts[index] & 255));
	const broadcastAddress = broadcastAddressParts.join('.');

	// Obtém o CIDR
	const cidr = subnetMask.startsWith('/') ? parseInt(subnetMask.slice(1)) : subnetMaskToCIDR(subnetMask);

	// Total de hosts e hosts utilizáveis
	const totalHosts = Math.pow(2, 32 - cidr);
	const usableHosts = totalHosts > 2 ? totalHosts - 2 : 0;

	// Intervalo de IPs utilizáveis
	const usableIPRange = usableHosts > 0
			? `${incrementIP(networkAddressParts, 1)} - ${incrementIP(broadcastAddressParts, -1)}`
			: "N/A";

	// Máscara em formato binário
	const subnetMaskBinary = subnetMaskToBinary(maskParts.join('.'));

	// Determinação de classe e tipo de IP
	const ipClass = calculateIPClass(cidr);
	const wildcardMask = calculateWildcardMask(maskParts);
	const ipType = calculateIPType(ipParts);

	// Retorna os resultados
	return {
			ipAddress: ipAddress,
			networkAddress: networkAddress,
			usableIPRange: usableIPRange,
			broadcastAddress: broadcastAddress,
			totalHosts: totalHosts,
			usableHosts: usableHosts,
			subnetMask: maskParts.join('.'),
			wildcardMask: wildcardMask,
			binarySubnetMask: subnetMaskBinary,
			ipClass: ipClass,
			cidrNotation: `/${cidr}`,
			ipType: ipType,
			shortIp: `${ipAddress}/${cidr}`
	};
}

// Função para validar IPv4
function validateIPv4(ip) {
	const parts = ip.split('.');
	return parts.length === 4 && parts.every(part => {
			const num = Number(part);
			return !isNaN(num) && num >= 0 && num <= 255;
	});
}

// Converte a máscara de sub-rede em formato CIDR para decimal
function subnetMaskToDottedDecimal(mask) {
	if (mask.startsWith('/')) {
			const cidr = parseInt(mask.slice(1));
			if (cidr < 0 || cidr > 32) {
					throw new Error("CIDR inválido.");
			}
			const binaryMask = ''.padStart(cidr, '1').padEnd(32, '0');
			return binaryMask.match(/.{8}/g).map(bin => parseInt(bin, 2));
	}
	return mask.split('.').map(octet => parseInt(octet));
}

// Calcula o CIDR a partir da máscara decimal
function subnetMaskToCIDR(mask) {
	return mask.split('.').reduce((cidr, octet) => cidr + (parseInt(octet).toString(2).match(/1/g) || []).length, 0);
}

// Converte a máscara de sub-rede para formato binário
function subnetMaskToBinary(mask) {
	return mask.split('.').map(part => parseInt(part).toString(2).padStart(8, '0')).join('.');
}

// Determina a classe do IP com base no CIDR
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

// Calcula a máscara wildcard
function calculateWildcardMask(maskParts) {
	return maskParts.map(part => 255 - part).join('.');
}

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

// Incrementa ou decrementa um endereço IP (em formato de array de partes)
function incrementIP(ipParts, increment) {
	const ip = ipParts.reduce((acc, part, index) => acc + BigInt(part) * (256n ** BigInt(3 - index)), 0n);
	const newIp = ip + BigInt(increment);
	return [
			Number((newIp >> 24n) & 255n),
			Number((newIp >> 16n) & 255n),
			Number((newIp >> 8n) & 255n),
			Number(newIp & 255n)
	].join('.');
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
