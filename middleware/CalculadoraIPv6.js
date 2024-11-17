function calculateSubnetIPv6(ipAddress, prefixLength) {
	const totalBits = 128; // Total de bits para IPv6
	const networkBits = parseInt(prefixLength);
	const hostBits = totalBits - networkBits;

	if (!validateIPv6(ipAddress)) {
			throw new Error("IPv6 Address inválido.");
	}

	const ipParts = expandIPv6(ipAddress).split(":").map(part => parseInt(part, 16));

	// Cálculo do endereço de rede
	const networkAddressParts = ipParts.map((part, index) => {
			const bitShift = (index + 1) * 16 > networkBits ? 16 - (networkBits % 16) : 0;
			return part & (0xffff << bitShift);
	});

	// Endereço de rede formatado
	const networkAddress = networkAddressParts.map(part => part.toString(16).padStart(4, "0")).join(":");

	// Cálculo do número total de hosts
	const totalHosts = BigInt(2) ** BigInt(hostBits);

	// Intervalo de hosts utilizáveis (IPv6 não usa broadcast)
	const firstUsableHost = networkAddressParts.map(part => part.toString(16).padStart(4, "0")).join(":");
	const lastUsableHost = calculateLastUsableHost(networkAddressParts, hostBits);

	return {
			ipAddress: ipAddress,
			networkAddress: networkAddress,
			usableIPRange: `${firstUsableHost} - ${lastUsableHost}`,
			totalHosts: totalHosts.toString(),
			prefixLength: `/${prefixLength}`,
			shortIp: `${ipAddress}/${prefixLength}`
	};
}

// Função para validar IPv6
function validateIPv6(ip) {
	const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}(([0-9a-fA-F]{1,4}:){1,4}|[0-9]{1,3}(\.[0-9]{1,3}){3})|([0-9a-fA-F]{1,4}:){1,4}:(([0-9a-fA-F]{1,4}:){1,4}|[0-9]{1,3}(\.[0-9]{1,3}){3}))$/;
	return ipv6Regex.test(ip);
}

// Função para expandir IPv6 (ex.: ::1 para 0000:0000:0000:0000:0000:0000:0000:0001)
function expandIPv6(ip) {
	const parts = ip.split("::");
	if (parts.length > 2) {
			throw new Error("Formato inválido de IPv6.");
	}
	const left = parts[0] ? parts[0].split(":") : [];
	const right = parts[1] ? parts[1].split(":") : [];
	const missing = 8 - (left.length + right.length);
	const middle = new Array(missing).fill("0000");
	return [...left, ...middle, ...right].map(part => part.padStart(4, "0")).join(":");
}

// Função para calcular o último host utilizável em IPv6
function calculateLastUsableHost(networkParts, hostBits) {
	const networkBigInt = networkParts.reduce((acc, part) => (acc << BigInt(16)) | BigInt(part), BigInt(0));
	const hostMask = (BigInt(1) << BigInt(hostBits)) - BigInt(1);
	const lastHostBigInt = networkBigInt | hostMask;
	const lastHostHex = lastHostBigInt.toString(16).padStart(32, "0");
	return lastHostHex.match(/.{1,4}/g).join(":");
}

/*
// Exemplo de uso:
const ipAddress = "2001:db8::";
const prefixLength = 64;

try {
	const result = calculateSubnetIPv6(ipAddress, prefixLength);
	console.log(result);
} catch (error) {
	console.error(error.message);
}
*/

// Exportando as funções
module.exports = {
	calculateSubnetIPv6
};
