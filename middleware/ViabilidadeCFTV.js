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
	
	const resistenciaPorMetro = cabo.r;

	// 2. Definições do Sistema
	// Câmeras geralmente toleram +-10%. O cálculo original usava 0.9 (90%).
	const tensaoMinimaAceitavel = tensaoNominalCam * 0.9; 

	// Resistência do Cabo (Ida e Volta = distancia * 2)
	const resistenciaTotalFio = distancia * 2 * resistenciaPorMetro;

	// Resistência da Câmera (Lei de Ohm: R = V / I)
	// Assumindo carga resistiva baseada nos dados nominais
	const resistenciaCamera = tensaoNominalCam / correnteNominalCam;

	// 3. Cálculos do Circuito (Divisor de Tensão)
	// Circuito Série: Fonte -> Fio -> Câmera -> Fio -> Terra
	// Resistência Total do Circuito = R_fio + R_camera
	const resistenciaCircuito = resistenciaTotalFio + resistenciaCamera;

	// Corrente Real que vai circular (I = V_fonte / R_total_circuito)
	const correnteReal = tensaoFonte / resistenciaCircuito;

	// Tensão que chega na Câmera (V = I_real * R_camera)
	const tensaoNaCamera = correnteReal * resistenciaCamera;

	// Queda de tensão no fio
	const quedaTensao = tensaoFonte - tensaoNaCamera;

	// 4. Análise de Viabilidade
	// É viável se a tensão que chega for maior ou igual à mínima necessária
	const viavel = tensaoNaCamera >= tensaoMinimaAceitavel;

	// 5. Cálculo da Distância Máxima Teórica
	// Para achar a dist máx, assumimos V_camera = V_minima.
	// I_limite = V_min / R_camera
	// V_drop_max = V_fonte - V_min
	// R_fio_max = V_drop_max / I_limite
	// Distancia_max = R_fio_max / (2 * resistenciaPorMetro)
	
	const correnteNoLimite = tensaoMinimaAceitavel / resistenciaCamera;
	const quedaMaximaPermitida = tensaoFonte - tensaoMinimaAceitavel;
	const resistenciaFioMaxima = quedaMaximaPermitida / correnteNoLimite;
	
	// Proteção contra divisão por zero se resistenciaPorMetro for 0 (idealmente impossível)
	const distanciaMaxima = resistenciaFioMaxima / (2 * resistenciaPorMetro);

	return {
			cabo_descricao: cabo.desc, // Útil para o frontend confirmar o que usou
			resistencia_metro: resistenciaPorMetro.toFixed(6), // Aumentei precisão visual
			resistencia_total_fio: Number(resistenciaTotalFio.toFixed(2)),
			tensao_chegada_camera: Number(tensaoNaCamera.toFixed(2)),
			queda_tensao: Number(quedaTensao.toFixed(2)),
			distancia_maxima_teorica: Number(distanciaMaxima.toFixed(2)),
			status: viavel ? "VIÁVEL" : "INVIÁVEL",
			viavel: viavel
	};
}

module.exports = { ViabilidadeCFTV };