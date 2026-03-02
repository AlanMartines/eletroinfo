# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0] - 2024-11-23

### 🚀 Adicionado
- **Calculadora Elétrica**: Novo endpoint `/api/CalculadoraEletrica` que centraliza cálculos da Lei de Ohm (Tensão, Corrente, Resistência), Potência DC, Consumo de Energia (kWh/Custo) e Estimativa de Autonomia de Bateria.
- **Calculadora de RAID**: Novo endpoint `/api/CalculadoraRAID` com suporte para níveis RAID 0, 1, 5, 6, 10, 50 e 60, calculando capacidade útil, proteção e eficiência.
- **Calculadora de RAM**: Novo endpoint `/api/LatenciaLarguraBandaRAM` para calcular a latência real (ns) e largura de banda teórica, suportando configurações de múltiplos canais (Dual/Quad Channel).
- **Calculadora de Transferência**: Novo endpoint `/api/CalculadoraDataTransfer` para estimar o tempo de transferência de arquivos com suporte a diversas unidades (Bits/Bytes até Yotta).
- **Calculadoras Corporais**: Novos endpoints para TMB (Taxa Metabólica Basal) e Massa Magra.
- **Viabilidade CFTV**: Implementação da lógica de cálculo de queda de tensão e distância máxima para cabeamento de câmeras de segurança.
- **Middlewares**: Criação de módulos isolados para cada lógica de negócio (`CalculadoraEletrica.js`, `CalculadoraRAID.js`, `CalculadoraRAM.js`, `CalculadoraTransferencia.js`, etc.), melhorando a organização do código.
- **Swagger**: Documentação OpenAPI 3.0 completa para todos os novos endpoints, incluindo esquemas de requisição e exemplos de resposta.

### ⚡ Alterado
- **Nome do Projeto**: Projeto renomeado para `eletroinfo`.
- **Teste de Portas de Rede**: Refatoração completa do middleware `TestePortasRede.js`.
  - Implementação de execução paralela (`Promise.all`) para testar múltiplas portas simultaneamente, reduzindo drasticamente o tempo de resposta.
  - Otimização da resolução de DNS (realizada apenas uma vez por host).
- **Consulta MAC Address**: Atualização do endpoint `/api/ConsultaFabricanteMAC`.
  - Migração para a API `api.maclookup.app` (mais robusta e com dados detalhados).
  - Melhoria na validação de formato do endereço MAC.
- **Autonomia Nobreak**:
  - Adicionado suporte para cálculo de bancos de baterias em **Série** e **Paralelo**.
  - Refinamento da fórmula de Peukert para maior precisão na estimativa de descarga.
- **Geolocalização e Consulta IP**:
  - Adicionada sanitização automática de endereços IPv4 mapeados em IPv6 (remoção do prefixo `::ffff:`).
  - Implementada detecção automática do IP do cliente caso o parâmetro não seja enviado.

### 🐛 Corrigido
- **Calculadora RAID**: Correção na lógica de cálculo para RAID 50 e 60, garantindo que o espaço não utilizado seja calculado corretamente quando o número de discos não é múltiplo exato dos grupos.
- **Calculadora Elétrica**: Inclusão da função `calcularQuedaDeTensao` no middleware para paridade com as ferramentas legadas.

---

*Este changelog foi gerado automaticamente com base na análise do código fonte e histórico de alterações recentes.*