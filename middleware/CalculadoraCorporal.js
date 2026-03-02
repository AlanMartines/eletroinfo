/**
 * Calculadora Corporal (Massa Magra, Gordura, TMB)
 * Baseado na classe CalculadoraCorporal (PHP)
 */

// Constantes
const GENERO = { MASCULINO: 'masculino', FEMININO: 'feminino' };

const FORMULA_TMB = {
    HARRIS_BENEDICT: 'harris-benedict',
    MIFFLIN_ST_JEOR: 'mifflin-st-jeor',
    KATCH_MCARDLE: 'katch-mcardle',
    CUNNINGHAM: 'cunningham'
};

const ATIVIDADE = {
    'sedentario': 1.2,
    'levemente_ativo': 1.375,
    'moderadamente_ativo': 1.55,
    'muito_ativo': 1.725,
    'extra_ativo': 1.9
};

// Helpers de Conversão
const cmToInches = (cm) => cm / 2.54;
const kgToLbs = (kg) => kg * 2.20462;

/**
 * Classifica a gordura corporal
 */
function validarGorduraCorporal(genero, porcentagem) {
    if (genero === GENERO.FEMININO) {
        if (porcentagem < 10) return "Gordura de baixo nível";
        if (porcentagem <= 13) return "Gordura essencial";
        if (porcentagem <= 20) return "Atletas";
        if (porcentagem <= 24) return "Ginástica";
        if (porcentagem <= 31) return "Média";
        return "Obeso";
    } else {
        if (porcentagem < 2) return "Gordura de baixo nível";
        if (porcentagem <= 5) return "Gordura essencial";
        if (porcentagem <= 13) return "Atletas";
        if (porcentagem <= 17) return "Ginástica";
        if (porcentagem <= 25) return "Média";
        return "Obeso";
    }
}

/**
 * Calcula métricas de composição corporal (Gordura, Massa Magra)
 */
function calcularComposicaoCorporal(genero, cintura, pescoco, quadril, altura, peso) {
    const cinturaIn = cmToInches(cintura);
    const pescocoIn = cmToInches(pescoco);
    const quadrilIn = cmToInches(quadril || 0);
    const alturaIn = cmToInches(altura);
    const pesoLbs = kgToLbs(peso);

    let gorduraMarinha = 0;
    let gorduraExercito = 0;
    let gorduraYMCA = 0;

    // 1. Método da Marinha (Padrão)
    if (genero === GENERO.MASCULINO) {
        if (cinturaIn <= pescocoIn) throw new Error("A cintura deve ser maior que o pescoço.");
        gorduraMarinha = 495 / (1.0324 - 0.19077 * Math.log10(cinturaIn - pescocoIn) + 0.15456 * Math.log10(alturaIn)) - 450;
    } else {
        if ((cinturaIn + quadrilIn) <= pescocoIn) throw new Error("A soma de cintura e quadril deve ser maior que o pescoço.");
        gorduraMarinha = 495 / (1.29579 - 0.35004 * Math.log10(cinturaIn + quadrilIn - pescocoIn) + 0.22100 * Math.log10(alturaIn)) - 450;
    }

    // 2. Método do Exército
    if (genero === GENERO.MASCULINO) {
        const diff = cinturaIn - pescocoIn;
        if (diff > 0) {
            gorduraExercito = 86.010 * Math.log10(diff) - 70.041 * Math.log10(alturaIn) + 36.76;
        }
    } else {
        const soma = cinturaIn + quadrilIn - pescocoIn;
        if (soma > 0) {
            gorduraExercito = 163.205 * Math.log10(soma) - 97.684 * Math.log10(alturaIn) - 78.387;
        }
    }

    // 3. Método YMCA
    if (pesoLbs > 0) {
        if (genero === GENERO.MASCULINO) {
            gorduraYMCA = ((4.15 * cinturaIn - 0.082 * pesoLbs - 98.42) / pesoLbs) * 100;
        } else {
            gorduraYMCA = ((4.15 * cinturaIn - 0.082 * pesoLbs - 76.76) / pesoLbs) * 100;
        }
    }

    // Tratamento de valores negativos
    gorduraMarinha = Math.max(0, gorduraMarinha);
    gorduraExercito = Math.max(0, gorduraExercito);
    gorduraYMCA = Math.max(0, gorduraYMCA);

    // Cálculos de Massa
    const massaGorda = (gorduraMarinha / 100) * peso;
    const massaMagra = peso - massaGorda;

    return {
        porcentagem_gordura_marinha: parseFloat(gorduraMarinha.toFixed(2)),
        porcentagem_gordura_exercito: parseFloat(gorduraExercito.toFixed(2)),
        porcentagem_gordura_ymca: parseFloat(gorduraYMCA.toFixed(2)),
        classificacao: validarGorduraCorporal(genero, gorduraMarinha),
        massa_gorda_kg: parseFloat(massaGorda.toFixed(2)),
        massa_magra_kg: parseFloat(massaMagra.toFixed(2))
    };
}

/**
 * Calcula a Taxa Metabólica Basal (TMB)
 */
function calcularTMB(formula, genero, peso, altura, idade, massaMagra) {
    let tmb = 0;

    switch (formula) {
        case FORMULA_TMB.HARRIS_BENEDICT:
            if (genero === GENERO.MASCULINO) {
                tmb = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade);
            } else {
                tmb = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade);
            }
            break;
        case FORMULA_TMB.MIFFLIN_ST_JEOR:
            if (genero === GENERO.MASCULINO) {
                tmb = (10 * peso) + (6.25 * altura) - (5 * idade) + 5;
            } else {
                tmb = (10 * peso) + (6.25 * altura) - (5 * idade) - 161;
            }
            break;
        case FORMULA_TMB.KATCH_MCARDLE:
            if (!massaMagra || massaMagra <= 0) throw new Error("Massa magra é obrigatória para a fórmula Katch-McArdle.");
            tmb = 370 + (21.6 * massaMagra);
            break;
        case FORMULA_TMB.CUNNINGHAM:
            if (!massaMagra || massaMagra <= 0) throw new Error("Massa magra é obrigatória para a fórmula Cunningham.");
            tmb = 500 + (22 * massaMagra);
            break;
        default:
            throw new Error(`Fórmula inválida. Use: ${Object.values(FORMULA_TMB).join(', ')}`);
    }

    return Math.round(tmb);
}

/**
 * Calcula Necessidade Diária e Déficit/Superávit
 */
function calcularTDEE(tmb, nivelAtividade) {
    const fator = ATIVIDADE[nivelAtividade];
    
    if (!fator) {
        throw new Error(`Nível de atividade inválido. Use: ${Object.keys(ATIVIDADE).join(', ')}`);
    }

    const tdee = Math.round(tmb * fator);
    
    return {
        tmb: tmb,
        tdee_manutencao: tdee,
        perda_peso: tdee - 450,
        ganho_peso: tdee + 450,
        nivel_atividade_fator: fator
    };
}

module.exports = { 
    calcularComposicaoCorporal, 
    calcularTMB, 
    calcularTDEE,
    GENERO,
    FORMULA_TMB 
};