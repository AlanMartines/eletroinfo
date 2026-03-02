/**
 * Calculadora Elétrica - Utilitário para cálculos elétricos
 * Baseado na classe CalculadoraEletrica (PHP)
 */

const RESISTIVIDADE_COBRE = 0.0172; // Ω·mm²/m

function calcularTensao(resistencia, corrente, potencia) {
    // V = R * I
    if (resistencia !== undefined && resistencia !== null && corrente !== undefined && corrente !== null) {
        return resistencia * corrente;
    }
    // V = P / I
    if (potencia !== undefined && potencia !== null && corrente !== undefined && corrente !== null) {
        if (corrente === 0) throw new Error("Corrente não pode ser 0 para calcular tensão pela potência.");
        return potencia / corrente;
    }
    throw new Error("Parâmetros insuficientes para calcular tensão.");
}

function calcularCorrente(tensao, resistencia, potencia) {
    // I = V / R
    if (tensao !== undefined && tensao !== null && resistencia !== undefined && resistencia !== null) {
        if (resistencia === 0) throw new Error("Resistência não pode ser 0.");
        return tensao / resistencia;
    }
    // I = P / V
    if (potencia !== undefined && potencia !== null && tensao !== undefined && tensao !== null) {
        if (tensao === 0) throw new Error("Tensão não pode ser 0.");
        return potencia / tensao;
    }
    throw new Error("Parâmetros insuficientes para calcular corrente.");
}

function calcularPotenciaDC(tensao, corrente) {
    if (tensao === undefined || corrente === undefined) throw new Error("Tensão e Corrente são obrigatórios.");
    return tensao * corrente;
}

function calcularConsumoKWh(potenciaWatts, horasPorDia, dias = 30) {
    if (!potenciaWatts || !horasPorDia) throw new Error("Potência e Horas de uso são obrigatórios.");
    return (potenciaWatts * horasPorDia * dias) / 1000;
}

function estimarCustoMensal(kwhMensal, precoKWh) {
    return kwhMensal * precoKWh;
}

function calcularQuedaDeTensao(metros, amperes, mm2) {
    if (mm2 <= 0) throw new Error("Bitola do cabo inválida.");
    
    const queda = (2 * metros * amperes * RESISTIVIDADE_COBRE) / mm2;
    
    return {
        volts: parseFloat(queda.toFixed(2)),
        percentual_127: parseFloat(((queda / 127) * 100).toFixed(2)),
        percentual_220: parseFloat(((queda / 220) * 100).toFixed(2))
    };
}

module.exports = {
    calcularTensao,
    calcularCorrente,
    calcularPotenciaDC,
    calcularConsumoKWh,
    estimarCustoMensal,
    calcularQuedaDeTensao
};