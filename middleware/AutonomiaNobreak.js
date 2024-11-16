// Função para calcular a tensão de corte
function calcularTensaoCorte(tipoBateria, quantidade, tensao) {
	let tensaoCortePorCelula = 0;
	let tensaoPorCelula = 0;

	switch (tipoBateria) {
			case 'chumbo_acido':
					tensaoCortePorCelula = 1.75;
					tensaoPorCelula = 2.1;
					break;
			case 'ion_litio':
					tensaoCortePorCelula = 3.0;
					tensaoPorCelula = 3.7;
					break;
			case 'niquel_cadmio':
			case 'niquel_hidreto_metalico':
			case 'niquel_ferro':
					tensaoCortePorCelula = 1.0;
					tensaoPorCelula = 1.2;
					break;
			case 'lithium_ferro_fosfato':
					tensaoCortePorCelula = 2.5;
					tensaoPorCelula = 3.2;
					break;
			case 'lithium_polimero':
					tensaoCortePorCelula = 3.0;
					tensaoPorCelula = 3.7;
					break;
			case 'zinco_ar':
					tensaoCortePorCelula = 1.0;
					tensaoPorCelula = 1.65;
					break;
			case 'sodio_enxofre':
					tensaoCortePorCelula = 1.5;
					tensaoPorCelula = 2.08;
					break;
			case 'zinco_brometo':
					tensaoCortePorCelula = 1.0;
					tensaoPorCelula = 1.8;
					break;
			case 'magnesio':
					tensaoCortePorCelula = 0.9;
					tensaoPorCelula = 1.1;
					break;
			case 'chumbo_carbono':
					tensaoCortePorCelula = 1.75;
					tensaoPorCelula = 2.1;
					break;
			case 'fluxo_redox':
					tensaoCortePorCelula = 1.0;
					tensaoPorCelula = 1.5;
					break;
			case 'aluminio_ar':
					tensaoCortePorCelula = 0.0; // Não recarregável
					tensaoPorCelula = 2.7;
					break;
			case 'lithium_enxofre':
					tensaoCortePorCelula = 1.7;
					tensaoPorCelula = 2.1;
					break;
			default:
					return Number((0.85 * quantidade * tensao).toFixed(2));
	}

	const numeroCelulas = Math.ceil(tensao / tensaoPorCelula);
	const tensaocorteBateria = numeroCelulas * tensaoCortePorCelula;
	const tensaocorte = quantidade * tensaocorteBateria;

	return Number(tensaocorte.toFixed(2));
}

// Função para calcular a autonomia
function calcularAutonomia(carga, tensao, capacidade, quantidade, tipoBateria) {
	const nnom = carga / (tensao * 0.85) / (capacidade * quantidade);
	const ut = -0.184 * Math.log(nnom) + 0.496;
	const cargautil = ut * capacidade * quantidade;
	const corrente = nnom * capacidade * quantidade;
	const min = (cargautil / corrente) * 60;

	const horas = Math.floor(min / 60);
	const minutos = Math.floor(min % 60);
	const segundos = Math.round((min % 1) * 60);

	const horasFormatadas = horas < 10 ? `0${horas}` : horas;
	const minutosFormatados = minutos < 10 ? `0${minutos}` : minutos;
	const segundosFormatados = segundos < 10 ? `0${segundos}` : segundos;

	const tensaocorte = calcularTensaoCorte(tipoBateria, quantidade, tensao);

	return {
			tensaocorte: tensaocorte,
			autonomia: `${horasFormatadas}:${minutosFormatados}:${segundosFormatados}`
	};
}

// Exportando as funções
module.exports = {
	calcularTensaoCorte,
	calcularAutonomia
};