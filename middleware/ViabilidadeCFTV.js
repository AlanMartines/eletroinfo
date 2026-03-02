/**
 * Tabela de Resistividade dos Cabos (Ohms por metro)
 * Baseado nos índices 0-7 fornecidos.
 */
const TABELA_CABOS = {
	0: { r: 0.130584, desc: "UTP (Par CAT5/6)" },    // ~26 AWG
	1: { r: 0.082393, desc: "Cabo de Alarme 4 vias (fino)" }, // ~24 AWG
	2: { r: 0.051986, desc: "Coaxial Fino / Bipolar 22 AWG" },
	3: { r: 0.033, desc: "Paralelo 0.50mm²" },
	4: { r: 0.016, desc: "Paralelo 0.75mm²" },
	5: { r: 0.010, desc: "Paralelo 1.0mm² ou 1.5mm²" },
	6: { r: 0.007, desc: "Paralelo 2.5mm²" },
	7: { r: 0.004, desc: "Paralelo 4.0mm²" }
};

function ViabilidadeCFTV(indiceBitola, tensaoFonte, tensaoNominalCam, correnteNominalCam, distancia) {
	
	// 1. Busca a resistência na tabela
	const cabo = TABELA_CABOS[indiceBitola];
	
	if (!cabo) {
			throw new Error(`Bitola do cabo inválida (Índice: ${indiceBitola}). Deve estar entre 0 e 7.`);
	}
	
	const resistencia = cabo.r;

	// Lógica portada do PHP (calcviabilidadecftv.php)

	// Calculando a tensão mínima da câmera (90%)
	const vcmim = tensaoNominalCam * 0.9;

	// Calculando a resistência máxima permitida para a instalação
	// $rmax = (($vfonte / $vcmim) - 1) * ($vcamera / $icamera) / 2;
	let rmax = ((tensaoFonte / vcmim) - 1) * (tensaoNominalCam / correnteNominalCam) / 2;

	// Calculando a resistência total do cabo com base na distância
	// $rtotal = ($distanciau * 2 * $resistencia);
	let rtotal = distancia * 2 * resistencia;

	// Calculando a distância máxima permitida para a instalação
	// $distanciamax = ($rmax / $resistencia);
	let distanciamax = rmax / resistencia;

	// Calculando a corrente de saída
	// $isaida = $vfonte / (($rtotal / 2) * 2 + $vcamera / $icamera);
	let isaida = tensaoFonte / (rtotal + (tensaoNominalCam / correnteNominalCam));

	// Calculando a tensão de saída
	// $vsaida = $vfonte - ($isaida * ($rtotal / 2) * 2);
	let vsaida = tensaoFonte - (isaida * rtotal);

	// Formatando os valores para apresentação (conforme PHP)
	distanciamax = Math.floor(distanciamax);
	
	// PHP usa intval, que trunca o valor
	const rtotalInt = Math.trunc(rtotal);
	const rmaxInt = Math.trunc(rmax);

	// Determinando a viabilidade
	// $res = $rmax < ($rtotal / 2) ? ...
	// Se rmax for menor que a resistência de uma perna do fio, é inviável.
	const viavel = !(rmaxInt < (rtotalInt / 2));

	return {
		resistencia_metro: resistencia,
		resistencia_total: rtotalInt,
		tensao_fornecida: vsaida.toFixed(1),
		corrente_fornecida: isaida.toFixed(2),
		distancia_maxima: distanciamax,
		viavel: viavel
	};
}

module.exports = { ViabilidadeCFTV };