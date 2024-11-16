function calcularViabilidadeInstalacaoCFTV(Bitola,	vfonte, vcamera,	icamera,	distanciau) {
	// Determinando a resistência com base no valor de Rcabo
	let resistencia;
	switch (Bitola) {
		case 0:
			resistencia = 0.130584;
			break;
		case 1:
			resistencia = 0.082393;
			break;
		case 2:
			resistencia = 0.051986;
			break;
		case 3:
			resistencia = 0.033;
			break;
		case 4:
			resistencia = 0.016;
			break;
		case 5:
			resistencia = 0.010;
			break;
		case 6:
			resistencia = 0.007;
			break;
		case 7:
			resistencia = 0.004;
			break;
		default:
			throw new Error("Bitola do cabo inválido. Deve estar entre 0 e 7.");
	}

	// Realizando os cálculos
	const vcmim = vcamera * 0.9; // Tensão mínima da câmera
	const rmax = ((vfonte / vcmim) - 1) * (vcamera / icamera) / 2; // Resistência máxima permitida
	const rtotal = distanciau * 2 * resistencia; // Resistência total
	const distanciamax = rmax / resistencia; // Distância máxima permitida
	const isaida = vfonte / ((rtotal / 2) * 2 + vcamera / icamera); // Corrente de saída
	const vsaida = vfonte - (isaida * (rtotal / 2) * 2); // Tensão fornecida

	// Determinando se a instalação é viável
	const viavel = rmax >= (rtotal / 2);

	// Criando o resultado final no formato solicitado
	return {
		resistencia_metro: resistencia.toFixed(3),
		resistencia_total: rtotal.toFixed(2),
		tensao_fornecida: vsaida.toFixed(2),
		distancia_maxima: distanciamax.toFixed(2),
		viavel: viavel
	};
}

// Exportando as funções
module.exports = {
	calcularViabilidadeInstalacaoCFTV
};
