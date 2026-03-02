/**
 * Calcula a tensão de corte para uma única bateria.
 * @param {string} tipoBateria
 * @param {number} tensaoIndividual
 * @returns {number}
 */
function calcularTensaoCorte(tipoBateria, tensaoIndividual) {
    const batterySpecs = {
        'chumbo_acido': { nominal: 2.1, corte: 1.75 },
        'ion_litio': { nominal: 3.7, corte: 3.0 },
        'niquel_cadmio': { nominal: 1.2, corte: 1.0 },
        'niquel_hidreto_metalico': { nominal: 1.2, corte: 1.0 },
        'lithium_ferro_fosfato': { nominal: 3.2, corte: 2.5 },
        'lithium_polimero': { nominal: 3.7, corte: 3.0 },
        'zinco_ar': { nominal: 1.65, corte: 1.0 },
        'niquel_ferro': { nominal: 1.2, corte: 1.0 },
        'sodio_enxofre': { nominal: 2.08, corte: 1.5 },
        'zinco_brometo': { nominal: 1.8, corte: 1.0 },
        'magnesio': { nominal: 1.1, corte: 0.9 },
        'chumbo_carbono': { nominal: 2.1, corte: 1.75 },
        'fluxo_redox': { nominal: 1.5, corte: 1.0 },
        'aluminio_ar': { nominal: 2.7, corte: 0.0 },
        'lithium_enxofre': { nominal: 2.1, corte: 1.7 }
    };

    if (batterySpecs[tipoBateria]) {
        const specs = batterySpecs[tipoBateria];
        const tensaoPorCelula = specs.nominal;
        const tensaoCortePorCelula = specs.corte;

        if (tensaoPorCelula === 0) return 0.0;

        const numeroCelulas = tensaoIndividual / tensaoPorCelula;
        const numCel = Math.ceil(numeroCelulas);
        return numCel * tensaoCortePorCelula;
    } else {
        return 0.85 * tensaoIndividual;
    }
}

/**
 * Calcula a autonomia do nobreak.
 * @param {number} carga - Carga em Watts
 * @param {number} tensaoIndividual - Tensão de uma bateria
 * @param {number} capacidadeIndividual - Capacidade de uma bateria (Ah)
 * @param {number} quantidade - Quantidade de baterias
 * @param {string} tipoBateria - Tipo da bateria
 * @param {string} tipoBanco - 'serie' ou 'paralelo'
 */
function calcularAutonomia(carga, tensaoIndividual, capacidadeIndividual, quantidade, tipoBateria, tipoBanco) {
    const eficienciaInversor = 0.85;
    let tensaoTotal, capacidadeTotalAh;

    // Lógica do Banco (Switch)
    if (tipoBanco === 'serie') {
        // SÉRIE: Tensão soma, Ah permanece o mesmo
        tensaoTotal = tensaoIndividual * quantidade;
        capacidadeTotalAh = capacidadeIndividual;
    } else {
        // PARALELO (padrão): Tensão permanece, Ah soma
        tensaoTotal = tensaoIndividual;
        capacidadeTotalAh = capacidadeIndividual * quantidade;
    }

    if (tensaoTotal <= 0 || eficienciaInversor <= 0 || capacidadeTotalAh <= 0) {
        return {
            autonomia: "00:00:00",
            tensaocorte: 0,
            mensagem: "Parâmetros inválidos para cálculo."
        };
    }

    // Corrente de descarga (Amperes) drenada do banco
    const corrente = carga / (tensaoTotal * eficienciaInversor);

    if (corrente <= 0) {
        return {
            autonomia: "??:??:??",
            tensaocorte: 0,
            mensagem: "Corrente calculada inválida."
        };
    }

    // Fator de descarga (C-rate)
    const nnom = corrente / capacidadeTotalAh;
    
    // Fator de capacidade útil (Aprox. Peukert)
    let ut = -0.184 * Math.log(nnom) + 0.496;

    if (ut <= 0) ut = 0.01;
    if (ut > 1) ut = 1.0;

    // Carga útil (Ah real) do banco
    const cargautil = ut * capacidadeTotalAh;
    
    // Tempo total em minutos
    const min = (cargautil / corrente) * 60;

    const horas = Math.floor(min / 60);
    const minutosFracionarios = (min / 60) - horas;
    const minutos = Math.floor(minutosFracionarios * 60);
    const segundosFracionarios = (minutosFracionarios * 60) - minutos;
    const seg = Math.round(segundosFracionarios * 60);

    const horasF = String(horas).padStart(2, '0');
    const minutosF = String(minutos).padStart(2, '0');
    const segF = String(seg).padStart(2, '0');

    // Cálculo da Tensão de Corte Total
    const tensaoCorteIndividual = calcularTensaoCorte(tipoBateria, tensaoIndividual);
    const tensaoCorteTotal = (tipoBanco === 'serie') ? (tensaoCorteIndividual * quantidade) : tensaoCorteIndividual;

    return {
        autonomia: `${horasF}:${minutosF}:${segF}`,
        tensaocorte: parseFloat(tensaoCorteTotal.toFixed(2)),
        mensagem: "Cálculo realizado com sucesso."
    };
}

module.exports = { calcularAutonomia };