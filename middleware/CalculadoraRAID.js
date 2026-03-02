/**
 * Calcula capacidade útil de RAID
 * Baseado na classe RAIDCalculator (PHP)
 * 
 * @param {number} capacidadeDisco - Capacidade de um único disco (em GB ou TB)
 * @param {number} qtdDiscos - Quantidade total de discos
 * @param {string|number} nivelRaid - Nível do RAID (0, 1, 5, 6, 10, 50, 60)
 */
function calcularRAID(capacidadeDisco, qtdDiscos, nivelRaid) {
    // Limpeza e conversão dos inputs
    let tipo = String(nivelRaid).replace(/raid/i, '').trim();
    tipo = parseInt(tipo, 10);
    const qtd = parseInt(qtdDiscos, 10);
    const tam = parseFloat(capacidadeDisco);

    // Validações básicas
    if (isNaN(qtd) || qtd < 1 || isNaN(tam) || tam <= 0) {
        throw new Error("A quantidade de discos e o tamanho dos discos devem ser maiores que 0.");
    }

    let capacidade = 0;
    let protecao = 0;
    
    switch (tipo) {
        case 0: // RAID 0 (Stripe)
            if (qtd < 2) throw new Error("RAID 0 requer pelo menos 2 discos.");
            capacidade = qtd * tam;
            break;
        case 1: // RAID 1 (Mirror)
            if (qtd < 2) throw new Error("RAID 1 requer pelo menos 2 discos.");
            capacidade = tam;
            protecao = tam;
            break;
        case 5: // RAID 5 (Striped with parity)
            if (qtd < 3) throw new Error("RAID 5 requer pelo menos 3 discos.");
            capacidade = (qtd - 1) * tam;
            protecao = tam;
            break;
        case 6: // RAID 6 (Double parity)
            if (qtd < 4) throw new Error("RAID 6 requer pelo menos 4 discos.");
            capacidade = (qtd - 2) * tam;
            protecao = 2 * tam;
            break;
        case 10: // RAID 10 (Mirror + Stripe)
            if (qtd < 4 || qtd % 2 !== 0) throw new Error("RAID 10 requer pelo menos 4 discos e um número par de discos.");
            capacidade = (qtd / 2) * tam;
            protecao = capacidade;
            break;
        case 50: // RAID 50 (RAID 5 + Stripe)
            if (qtd < 6) throw new Error("RAID 50 requer pelo menos 6 discos.");
            // Cada grupo RAID 5 tem pelo menos 3 discos
            const grupos50 = Math.floor(qtd / 3);
            const discosUsados50 = grupos50 * 3;
            capacidade = (discosUsados50 - grupos50) * tam;
            protecao = grupos50 * tam;
            break;
        case 60: // RAID 60 (RAID 6 + Stripe)
            if (qtd < 8) throw new Error("RAID 60 requer pelo menos 8 discos.");
            // Cada grupo RAID 6 tem pelo menos 4 discos
            const grupos60 = Math.floor(qtd / 4);
            const discosUsados60 = grupos60 * 4;
            capacidade = (discosUsados60 - (2 * grupos60)) * tam;
            protecao = (grupos60 * 2) * tam;
            break;
        default:
            throw new Error("Tipo de RAID inválido. Use RAID 0, 1, 5, 6, 10, 50 ou 60.");
    }

    // Calcular espaço não utilizado (sobra)
    const totalEspaco = qtd * tam;
    const naoUsado = Math.max(0, totalEspaco - (capacidade + protecao));
    const eficiencia = (capacidade / totalEspaco) * 100;

    return {
        nivel_raid: `RAID ${tipo}`,
        quantidade_discos: qtd,
        tamanho_por_disco: tam,
        capacidade_util: parseFloat(capacidade.toFixed(2)),
        protecao_dados: parseFloat(protecao.toFixed(2)),
        espaco_nao_utilizado: parseFloat(naoUsado.toFixed(2)),
        eficiencia: eficiencia.toFixed(1) + '%'
    };
}
