const IP = require('../function/ip');

function calculateIPInfo(ipAddr, maskInput) {
    if (!ipAddr || !maskInput) throw new Error("IP e Máscara são obrigatórios.");

    let ip;
    try {
        ip = new IP(ipAddr);
    } catch (e) {
        throw new Error("Endereço IP inválido.");
    }

    if (ip.version === 4) {
        return calculateIPv4(ip, maskInput);
    } else {
        return calculateIPv6(ip, maskInput);
    }
}

function calculateIPv4(ipObj, maskInput) {
    let cidr;
    let maskInt;

    // Determina o CIDR (aceita "/24" ou "255.255.255.0")
    if (maskInput.toString().startsWith('/')) {
        cidr = parseInt(maskInput.replace('/', ''), 10);
        if (isNaN(cidr) || cidr < 0 || cidr > 32) throw new Error("Prefixo CIDR inválido.");
    } else {
        try {
            const maskObj = new IP(maskInput);
            if (maskObj.version !== 4) throw new Error("Máscara inválida.");
            const tempMaskInt = maskObj.toInteger();
            // Conta os bits '1' para achar o CIDR
            cidr = tempMaskInt.toString(2).split('1').length - 1;
        } catch (e) {
            throw new Error("Máscara de sub-rede inválida.");
        }
    }

    // Calcula Máscara Inteira a partir do CIDR
    const maxVal = (BigInt(2) ** BigInt(32));
    maskInt = maxVal - (BigInt(2) ** BigInt(32 - cidr));

    const ipInt = ipObj.toInteger();
    const networkInt = ipInt & maskInt;
    const wildcardInt = (BigInt(2) ** BigInt(32)) - BigInt(1) - maskInt;
    const broadcastInt = networkInt | wildcardInt;

    const usableStartInt = networkInt + 1n;
    const usableEndInt = broadcastInt - 1n;

    const totalHosts = BigInt(2) ** BigInt(32 - cidr);
    const usableHosts = (cidr >= 31) ? 0n : totalHosts - 2n;

    // Formatação
    const networkAddress = ipObj.toDottedNotation(networkInt);
    const broadcastAddress = ipObj.toDottedNotation(broadcastInt);
    const usableStart = ipObj.toDottedNotation(usableStartInt);
    const usableEnd = ipObj.toDottedNotation(usableEndInt);
    const subnetMaskStr = ipObj.toDottedNotation(maskInt);
    const wildcardMaskStr = ipObj.toDottedNotation(wildcardInt);

    // Máscara Binária
    let binaryMask = maskInt.toString(2).padStart(32, '0');
    binaryMask = binaryMask.match(/.{1,8}/g).join('.');

    // Classe e Tipo
    const parts = ipObj.address.split('.').map(Number);
    const first = parts[0];
    let ipClass = 'E';
    if (first >= 0 && first <= 127) ipClass = 'A';
    else if (first >= 128 && first <= 191) ipClass = 'B';
    else if (first >= 192 && first <= 223) ipClass = 'C';
    else if (first >= 224 && first <= 239) ipClass = 'D';

    let ipType = "Public";
    if (first === 10) ipType = "Private";
    else if (first === 172 && parts[1] >= 16 && parts[1] <= 31) ipType = "Private";
    else if (first === 192 && parts[1] === 168) ipType = "Private";
    else if (first === 127) ipType = "Loopback";
    else if (first >= 224 && first <= 239) ipType = "Multicast";

    return {
        ipAddress: ipObj.address,
        networkAddress: networkAddress,
        usableIPRange: `${usableStart} - ${usableEnd}`,
        broadcastAddress: broadcastAddress,
        totalHosts: totalHosts.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."),
        usableHosts: usableHosts.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."),
        subnetMask: subnetMaskStr,
        wildcardMask: wildcardMaskStr,
        binarySubnetMask: binaryMask,
        ipClass: ipClass,
        cidrNotation: `/${cidr}`,
        ipType: ipType,
        shortIp: `${ipObj.address}/${cidr}`
    };
}

function calculateIPv6(ipObj, maskInput) {
    let cidr = parseInt(maskInput.toString().replace('/', ''), 10);

    if (isNaN(cidr) || cidr < 0 || cidr > 128) throw new Error("Prefixo CIDR IPv6 inválido.");

    const ipInt = ipObj.toInteger();
    
    // Máscara 128 bits
    const maxVal = (BigInt(2) ** BigInt(128));
    const maskInt = maxVal - (BigInt(2) ** BigInt(128 - cidr));

    const networkInt = ipInt & maskInt;
    const wildcardInt = (BigInt(2) ** BigInt(128)) - BigInt(1) - maskInt;
    const lastInt = networkInt | wildcardInt;

    const totalHosts = BigInt(2) ** BigInt(128 - cidr);
    const networkAddress = ipObj.toDottedNotation(networkInt);
    const lastAddress = ipObj.toDottedNotation(lastInt);
    const ipAddressFull = ipObj.toDottedNotation(ipInt);

    return {
        ipAddress: ipObj.address,
        ipAddressFull: ipAddressFull,
        networkAddress: networkAddress,
        usableIPRange: `${networkAddress} - ${lastAddress}`,
        totalHosts: totalHosts.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."),
        cidrNotation: `/${cidr}`,
        shortIp: `${ipObj.address}/${cidr}`
    };
}

module.exports = { calculateIPInfo };