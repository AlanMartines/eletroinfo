// Função para calcular a tensão de corte
function calcularTensaoCorte(tipoBateriaRaw, quantidade, tensaoTotalBanco) {
	// Normaliza a string para evitar erros (ex: "Ion Litio" vira "ion_litio")
	// Se o input já vier correto (com underscore), isso não quebra.
	const tipoNormalizado = tipoBateriaRaw.toLowerCase().replace(/\s+/g, '_');

	let dadosCelula = { corte: 0, nominal: 0 };

	switch (tipoNormalizado) {
			case 'chumbo_acido':
			case 'chumbo_carbono': // Comportamento similar
					dadosCelula = { corte: 1.75, nominal: 2.1 }; // 12V = 6 células
					break;
			case 'ion_litio':
			case 'lithium_polimero':
					dadosCelula = { corte: 3.0, nominal: 3.7 };
					break;
			case 'lithium_ferro_fosfato': // LiFePO4
					dadosCelula = { corte: 2.5, nominal: 3.2 };
					break;
			case 'niquel_cadmio':
			case 'niquel_hidreto_metalico':
					dadosCelula = { corte: 1.0, nominal: 1.2 };
					break;
			case 'aluminio_ar':
					dadosCelula = { corte: 1.2, nominal: 2.7 }; // Ajustado corte para valor realista
					break;
			default:
					// Fallback genérico: corta em 85% da tensão total se não reconhecer o tipo
					return Number((0.85 * tensaoTotalBanco).toFixed(2));
	}

	// Estima o número de células em série baseada na tensão total do banco informada
	// Ex: 12V Chumbo / 2.1 = 5.71 -> Arredonda para 6 células
	const numeroCelulasSerie = Math.ceil(tensaoTotalBanco / dadosCelula.nominal);
	
	// Tensão de corte total = (Células em Série * Tensão Corte Célula) * Quantidade de Bancos (se série)
	// OBS: Assume-se que 'quantidade' refere-se a bancos em paralelo ou que a tensão total já considera a série.
	// O cálculo original multiplicava 'quantidade * tensaocorteBateria'. Isso sugere que 'quantidade' aumenta a tensão (série).
	// Se 'quantidade' for bancos paralelos, a tensão de corte não muda, apenas a capacidade.
	// Mantendo a lógica original de que Quantidade afeta a tensão final (Série de monoblocos):
	
	const tensaoCorteFinal = numeroCelulasSerie * dadosCelula.corte * quantidade;

	return Number(tensaoCorteFinal.toFixed(2));
}

function calcularAutonomia(carga, tensao, capacidade, quantidade, tipoBateria) {
	const EFICIENCIA_INVERSOR = 0.85; 
	
	// Corrente Total necessária do banco de baterias (I = P / V)
	// Tensão Total = Tensão da Bateria * Quantidade (assumindo série conforme lógica original)
	const tensaoTotal = tensao * quantidade;
	const correnteDescarga = carga / (tensaoTotal * EFICIENCIA_INVERSOR);
	
	// Capacidade Total do Banco (Ah)
	// Se 'quantidade' for série, a capacidade em Ah não muda, mantém a da unidade.
	// O código original fazia: nnom = carga / ... / (capacidade * quantidade).
	// Isso sugere que a capacidade aumentava com a quantidade? 
	// VAMOS ASSUMIR O CENÁRIO PADRÃO DE NOBREAK:
	// Tensão = Tensão do barramento DC. Capacidade = Ah das baterias.
	
	// C-Rate (Taxa de descarga) = Corrente / Capacidade
	const cRate = correnteDescarga / capacidade; 

	// --- FATOR DE PEUKERT / UTILIZAÇÃO ---
	// A fórmula original (-0.184 * log + 0.496) é muito agressiva e específica para Chumbo-Ácido.
	// Para Lítio, o fator de utilização é próximo de 1 (ou 100%) até taxas altas.
	
	let fatorUtilizacao = 1.0;
	
	const tipo = tipoBateria.toLowerCase();
	
	if (tipo.includes('chumbo') || tipo.includes('plomo')) {
			// Fórmula original (Aproximação de Peukert para Chumbo)
			// Adicionei Math.max para evitar nnom zero ou negativo log
			const nnomSeguro = cRate <= 0 ? 0.001 : cRate;
			fatorUtilizacao = -0.184 * Math.log(nnomSeguro) + 0.496;
			
			// Limites físicos: a bateria não entrega mais que 100% nem menos que 0% (teoricamente)
			if (fatorUtilizacao > 1) fatorUtilizacao = 1;
			if (fatorUtilizacao < 0.1) fatorUtilizacao = 0.1;
	} else {
			// Para Lítio e outros, a curva é muito melhor. 
			// Simplificação: Perda de 5% a cada 1C de taxa.
			fatorUtilizacao = 1 - (cRate * 0.05);
			if (fatorUtilizacao < 0.8) fatorUtilizacao = 0.8; // Lítio raramente entrega menos que isso
	}

	// Cálculo do tempo
	// Tempo (h) = (Capacidade Ah * Fator) / Corrente A
	const horasDecimais = (capacidade * fatorUtilizacao) / correnteDescarga;
	
	const minutosTotais = horasDecimais * 60;

	const horas = Math.floor(minutosTotais / 60);
	const minutos = Math.floor(minutosTotais % 60);
	const segundos = Math.round((minutosTotais % 1) * 60);

	// Formatação
	const pad = (num) => String(num).padStart(2, '0');
	
	// Se a carga for maior que a capacidade suportada (tempo negativo ou infinito)
	if (!isFinite(horas) || horas < 0) {
			return {
					tensaocorte: 0,
					autonomia: "00:00:00",
					aviso: "Carga excessiva para o banco de baterias."
			};
	}

	const tensaoCorte = calcularTensaoCorte(tipoBateria, quantidade, tensao);

	return {
			tensaocorte: tensaoCorte,
			autonomia: `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`
	};
}

// Exportando as funções
module.exports = { calcularTensaoCorte, calcularAutonomia };