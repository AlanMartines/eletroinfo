/* global BigInt */
const IP = require('./ip.js');

const IPv4MAX = (BigInt(2) ** BigInt(32)) - BigInt(1);
const IPv6MAX = (BigInt(2) ** BigInt(128)) - BigInt(1);

//IP range specific information, see IANA allocations.
// http://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml
let _ipv4Registry = new Map([
	['0.0.0.0', [8, 'This host on this network']],
	['10.0.0.0', [8, 'Private Use']],
	['100.64.0.0', [10, 'Shared Address Space (RFC 6598)']],
	['127.0.0.0', [8, 'Loopback']],
	['169.254.0.0', [16, 'Link Local']],
	['172.16.0.0', [12, 'Private Use']],
	['192.0.0.0', [24, 'IETF Protocol Assignments']],
	['192.0.0.8', [32, 'IPv4 Dummy Address']],
	['192.0.0.9', [32, 'Port Control Protocol Anycast']],
	['192.0.0.10', [32, 'Traversal Using Relays around NAT']],
	['192.0.0.170', [32, 'NAT64/DNS64 Discovery']],
	['192.0.2.0', [24, 'Documentation (TEST-NET-1)']],
	['192.31.196.0', [24, 'AS112-v4']],
	['192.52.193.0', [24, 'AMT']],
	['192.88.99.0', [24, 'Deprecated (6to4 Relay Anycast)']],
	['192.168.0.0', [16, 'Private Use']],
	['192.175.48.0', [24, 'Direct Delegation AS112 Service']],
	['198.18.0.0', [15, 'Benchmarking (RFC 2544)']],
	['198.51.100.0', [24, 'Documentation (TEST-NET-2)']],
	['203.0.113.0', [24, 'Documentation (TEST-NET-3)']],
	['224.0.0.0', [4, 'Multicast']],
	['240.0.0.0', [4, 'Future Use']],
	['255.255.255.255', [32, 'Limited Broadcast']]
]);

//https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml
let _ipv6Registry = new Map([
	['::1', [128, 'Loopback Address']],
	['::', [128, 'Unspecified Address']],
	['::ffff:0:0', [96, 'IPv4-Mapped Address']],
	['64:ff9b::', [96, 'IPv4-IPv6 Translation']],
	['64:ff9b:1::', [48, 'IPv4-IPv6 Translation']],
	['100::', [64, 'Discard-Only Address Block']],
	['2001::', [23, 'IETF Protocol Assignments']],
	['2001:1::1', [128, 'Port Control Protocol Anycast']],
	['2001:1::2', [128, 'Traversal Using Relays around NAT']],
	['2001:2::', [48, 'Benchmarking']],
	['2001:3::', [32, 'AMT']],
	['2001:4:112::', [48, 'AS112-v6']],
	['2001:5::', [32, 'EID Space for LISP']],
	['2001:10::', [28, 'Deprecated (previously ORCHID)']],
	['2001:20::', [28, 'ORCHIDv2']],
	['2001:db8::', [32, 'Documentation']],
	['2002::', [16, '6to4']],
	['fc00::', [7, 'Unique-Local']],
	['fe80::', [10, 'Link-Local Unicast']],
	['ff00::', [8, 'Multicast']]
]);

/**
* Network slice calculations.
* @class Network
* @param {string} address
* @param {integer} prefix
* host = new IP("127.128.99.3",8)
* @return {object} -> IP{address:"127.128.99.3", prefix: 8}
*/

class Network extends IP {
	/**
	* Extends IP class. Calls the parent class IP with the parameters passed to Network.
	* @constructor
	*/
	constructor(address, prefix) {
		super(address);
		this.prefix = this._checkPrefix(prefix);
	}

	// Private methods

	/**
	* _checkPrefix - Returns this IP prefix and validates it
	* @private
	* @return {integer} -> prefix: 25n
	*/
	_checkPrefix(prefix) {
		if (this.version === 4) {
			if (prefix > 0 && prefix <= 32) {
				return BigInt(prefix);
			}
		} else {
			if (prefix > 0 && prefix <= 128) {
				return BigInt(prefix);
			}
		}
		throw new Error('Prefixo inválido');
	}

	// Public methods

	/**
	 * Verifica se o IP é um IPv6 público válido.
	 * Retorna true se o IP não for reservado ou especial.
	 */
	isValidIPv6Public() {
		const reservedPrefixes = [
			'fc00::/7',   // Unique Local Addresses
			'fe80::/10',  // Link-Local Addresses
			'ff00::/8',   // Multicast Addresses
			'::1/128',    // Loopback Address
			'::/128',     // Unspecified Address
			'2001:db8::/32' // Documentation
		];

		const ipBigInt = this.toInteger();
		for (const prefix of reservedPrefixes) {
			const [prefixAddr, prefixLength] = prefix.split('/');
			const prefixBigInt = new Network(prefixAddr, parseInt(prefixLength, 10)).toInteger();
			const maskBigInt = IPv6MAX >> (BigInt(128) - BigInt(prefixLength));

			if ((ipBigInt & maskBigInt) === prefixBigInt) {
				return false; // Está em uma faixa reservada ou especial
			}
		}

		return true; // É um IPv6 público válido
	}

	/**
	* printInfo - Shows IANA allocation information for the current IP address.
	* @return {string} ->LOOPBACK
	*/
	printInfo() {
		let registry = { 4: _ipv4Registry, 6: _ipv6Registry };
		let results = [];
		for (let [addr, info] of registry[this.version].entries()) {
			let found = this.contains(this.address, addr, info[0]);
			if (found) {
				results.unshift(info[1]); // Adiciona a descrição ao resultado
			}
		}
		// Se nenhum resultado for encontrado, assume que é "Public Use" para IPv4
		return results.length === 0 ? (this.version === 4 ? 'Public Use' : 'Unknown') : results[0];
	}

	/**
	* maskToInteger - Returns network mask as bigInt
	* @return {BigInt} -> 4278190080n
	*/
	maskToInteger() {
		if (this.version == 4) {
			return (IPv4MAX >> (BigInt(32) - this.prefix)) << (BigInt(32) - this.prefix);
		}
		else {
			return (IPv6MAX >> (BigInt(128) - this.prefix)) << (BigInt(128) - this.prefix);
		}
	}

	/**
	* getMask - Returns mask from the prefix
	* @return {string} -> 255.255.0.0
	*/
	getMask() {
		return this.toDottedNotation(this.maskToInteger());
	}

	/**
	* networkToInteger - Returns network as bigInt.
	* @return {BigInt} -> 21307064320
	*/
	networkToInteger() {
		return this.toInteger() & this.maskToInteger();
	}

	/**
	* getNetwork - Returns network part of the address
	* @return {string} -> 127
	*/
	getNetwork() {
		return this.toDottedNotation(this.networkToInteger());
	}

	/**
	* getBroadcast - Calculates broadcast.IPv6 doesn't have a broadcast
	* address, but it's used for other calculations such as Network.hostLast.
	* @return {string} -> 127.255.255.255
	*/
	getBroadcast() {
		return this.version === 4 ?
			this.toDottedNotation(this.broadcastToLong()) :
			'O IPv6 não possui endereço de broadcast';
	}

	/**
	* broadcastToLong - Returns broadcast as long.
	* @return {BigInt} ->2147483647
	*/
	broadcastToLong() {
		if (this.version === 4) {
			return this.networkToInteger() | (IPv4MAX - this.maskToInteger());
		} else {
			return this.networkToInteger() | (IPv6MAX - this.maskToInteger());
		}
	}

	/**
	* hostFirst - Calculates first available host in this subnet.
	* @return {string} ->127.0.0.1
	*/
	hostFirst() {
		let isSmall4 = this.version === 4 && this.prefix > BigInt(30);
		let first;

		if (this.version === 6) {
			first = this.getNetwork();
		} else if (isSmall4) {
			return 'N/A';
		} else {
			first = this.toDottedNotation(this.networkToInteger() + BigInt(1));
		}
		return this.toCompressed(first, this.version);
	}

	/**
	* hostLast - Calculates last available host in this subnet.
	* @return {string} ->127.255.255.255
	*/
	hostLast() {
		let isLast4 = this.version === 4 && this.prefix === BigInt(32);
		let isLast6 = this.version === 6 && this.prefix === BigInt(128);
		let isPrev4 = this.version === 4 && this.prefix === BigInt(31);
		let isPrev6 = this.version === 6 && this.prefix === BigInt(127);
		let last;

		if (isLast4 || isLast6 || isPrev4) {
			return 'N/A';
		} else if (isPrev6) {
			last = this.address;
		} else if (this.version === 4) {
			last = this.toDottedNotation(this.broadcastToLong() - BigInt(1));
		} else {
			last = this.toDottedNotation(this.broadcastToLong());
		}
		return this.toCompressed(last, this.version);
	}

	/**
	* contains - Check if thisIP is part of the network
	* @param {string} thisIP
	* @param {string} otherIP
	* @param {number} prefix
	* @return {boolean}
	*/
	contains(thisIP, otherIP, prefix) {
		let other = new Network(otherIP, prefix);
		let thisNetwork = this.networkToInteger();
		let otherNetwork = other.networkToInteger();
		let smaller = (thisNetwork <= otherNetwork) &&
			(otherNetwork <= this.broadcastToLong());
		let bigger = (otherNetwork <= thisNetwork) &&
			(thisNetwork <= other.broadcastToLong());
		return smaller || bigger;
	}

	/**
	* hostRange - Generates a range of usable host IP addresses within the network.
	* @return {array} -> ['127.0.0.1','127.255.255.255']
	*/
	hostRange() {
		let range = [];
		range.push(this.hostFirst());
		range.push(this.hostLast());
		return range;
	}

	/**
	* networkSize - Returns number of ips within the network.
	* @return {number} -> 16777214
	*/
	networkSize() {
		let marks = { 4: BigInt(32), 6: BigInt(128) };
		let size = BigInt(2) ** (marks[this.version] - this.prefix);

		if (this.version === 4 && this.prefix < BigInt(30)) {
			return size - BigInt(2);
		}
		return size;
	}

}

module.exports = Network;