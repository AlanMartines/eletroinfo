/**
 * Calcula Latência e Largura de Banda da RAM
 * Baseado na lógica da classe MemoryCalculator (PHP)
 * 
 * @param {number} speed - Velocidade efetiva (MT/s ou MHz comercial)
 * @param {number} cas - Latência CAS (CL)
 * @param {number} channels - Número de canais (1, 2, 4...) - Padrão: 1
 * @param {number} width - Largura do barramento em bits - Padrão: 64
 */
function calcularRAM(speed, cas, channels = 1, width = 64) {
    // Validações básicas
    if (speed <= 0) throw new Error("A frequência deve ser maior que zero.");
    if (cas <= 0) throw new Error("A latência CAS deve ser maior que zero.");
    if (channels <= 0) throw new Error("O número de canais deve ser maior que zero.");
    if (width <= 0) throw new Error("A largura do barramento deve ser maior que zero.");

    // 1. Largura de Banda (MB/s)
    // Fórmula: (Speed * Width * Channels) / 8 (bits para bytes)
    const bandwidth = (speed * width * channels) / 8;

    // 2. Clock Real (MHz) - Metade da taxa de transferência em DDR
    const realClock = speed / 2;

    // 3. Tempo de Ciclo (ns)
    // T = 1 / f (f em GHz para ns) -> 1000 / MHz
    // Se realClock <= 0, retorna 0
    const cycleTime = realClock > 0 ? (1000 / realClock) : 0;

    // 4. Latência Real (First Word Latency) em nanossegundos
    // Fórmula: (CL * 2000) / Velocidade_Efetiva
    const latency = (cas * 2000) / speed;

    return {
        frequencia_efetiva: speed,
        clock_real: realClock,
        cas_latency: cas,
        canais: channels,
        largura_bus: width,
        largura_banda_mbs: parseFloat(bandwidth.toFixed(2)),
        largura_banda_gbs: parseFloat((bandwidth / 1000).toFixed(2)),
        tempo_ciclo_ns: parseFloat(cycleTime.toFixed(3)),
        latencia_ns: parseFloat(latency.toFixed(3))
    };
}

module.exports = { calcularRAM };