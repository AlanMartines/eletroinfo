/**
 * Helper para pluralização
 */
function pluralize(value, singular, plural = null) {
    if (value === 1) {
        return `${value} ${singular}`;
    } else {
        return `${value} ${plural ? plural : singular + 's'}`;
    }
}

/**
 * Calcula o tempo de transferência
 * @param {number} tamanho - Tamanho do arquivo
 * @param {string} unidadeTamanho - Unidade do tamanho (ex: GB, MiB)
 * @param {number} velocidade - Velocidade da conexão
 * @param {string} unidadeVelocidade - Unidade da velocidade (ex: Mbps)
 */
function calcularTransferencia(tamanho, unidadeTamanho, velocidade, unidadeVelocidade) {
    // Definição de unidades (Padrão SI e IEC)
    // SI: k=1000, M=1000^2...
    // IEC: Ki=1024, Mi=1024^2...
    const units = {
        // Bits
        'bit': 1, 'bps': 1,
        'kbit': 1e3, 'kbps': 1e3, 'Kbps': 1e3, 'Mbit': 1e6, 'mbps': 1e6, 'Mbps': 1e6, 'Gbit': 1e9, 'gbps': 1e9, 'Gbps': 1e9, 'Tbit': 1e12, 'tbps': 1e12, 'Tbps': 1e12, 'Pbit': 1e15, 'pbps': 1e15, 'Pbps': 1e15, 'Ebit': 1e18, 'ebps': 1e18, 'Ebps': 1e18, 'Zbit': 1e21, 'zbps': 1e21, 'Zbps': 1e21, 'Ybit': 1e24, 'ybps': 1e24, 'Ybps': 1e24,
        'Kibit': 1024, 'Mibit': 1024**2, 'Gibit': 1024**3, 'Tibit': 1024**4, 'Pibit': 1024**5, 'Eibit': 1024**6, 'Zibit': 1024**7, 'Yibit': 1024**8,
        
        // Bytes (1 Byte = 8 bits)
        'B': 8, 'B/s': 8,
        'kB': 8 * 1e3, 'kB/s': 8 * 1e3, 'MB': 8 * 1e6, 'MB/s': 8 * 1e6, 'GB': 8 * 1e9, 'GB/s': 8 * 1e9, 'TB': 8 * 1e12, 'TB/s': 8 * 1e12, 'PB': 8 * 1e15, 'PB/s': 8 * 1e15, 'EB': 8 * 1e18, 'EB/s': 8 * 1e18, 'ZB': 8 * 1e21, 'ZB/s': 8 * 1e21, 'YB': 8 * 1e24, 'YB/s': 8 * 1e24,
        'KiB': 8 * 1024, 'KiB/s': 8 * 1024, 'MiB': 8 * 1024**2, 'MiB/s': 8 * 1024**2, 'GiB': 8 * 1024**3, 'GiB/s': 8 * 1024**3, 'TiB': 8 * 1024**4, 'TiB/s': 8 * 1024**4, 'PiB': 8 * 1024**5, 'PiB/s': 8 * 1024**5, 'EiB': 8 * 1024**6, 'EiB/s': 8 * 1024**6, 'ZiB': 8 * 1024**7, 'ZiB/s': 8 * 1024**7, 'YiB': 8 * 1024**8, 'YiB/s': 8 * 1024**8
    };

    const sizeMult = units[unidadeTamanho];
    const speedMult = units[unidadeVelocidade];

    if (!sizeMult || !speedMult) {
        throw new Error("Unidade de medida inválida.");
    }

    const totalBits = tamanho * sizeMult;
    const bitsPerSecond = velocidade * speedMult;

    if (bitsPerSecond <= 0) {
        throw new Error("A velocidade deve ser maior que zero.");
    }

    const seconds = totalBits / bitsPerSecond;

    // Formatação do tempo
    const days = Math.floor(seconds / 86400);
    const remainderSeconds = seconds % 86400;
    
    const hours = Math.floor(remainderSeconds / 3600);
    const minutes = Math.floor((remainderSeconds % 3600) / 60);
    const secs = Math.floor(remainderSeconds % 60);

    const parts = [];
    if (days > 0) parts.push(pluralize(days, 'dia'));
    
    const timeString = [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(secs).padStart(2, '0')
    ].join(':');

    let formattedTime = timeString;
    if (parts.length > 0) {
        formattedTime = parts.join(', ') + ', ' + timeString;
    }

    return {
        tempo_estimado: formattedTime,
        segundos_totais: seconds,
        detalhes: { dias: days, horas: hours, minutos: minutes, segundos: secs }
    };
}

module.exports = { calcularTransferencia };