Índice
======

1.  [Endpoint - Cálculo de Autonomia de Nobreak](#endpoint---calculo-de-autonomia-de-nobreak)
2.  [Endpoint - Viabilidade da Instalação CFTV](#endpoint---viabilidade-da-instalacao-cftv)
3.  [Endpoint - Consulta de IP](#endpoint---consulta-de-ip)

## Endpoint - Cálculo de Autonomia de Nobreak

## Detalhes do Endpoint

- **Método:** POST
- **URL:** `{base_url}/api/AutonomiaNobreak`
- **Descrição:** Substitua `{base_url}` pela URL da API fornecida pelo servidor.

## Headers Necessários

```json
{
  "Content-Type": "application/json"
}
```

## Entradas Necessárias

Os seguintes parâmetros devem ser fornecidos no corpo da requisição:

- **carga_aplicada:** Consumo do equipamento em watts (W).
- **tensao_bateria:** Tensão nominal da bateria em volts (V).
- **capacidade_bateria:** Capacidade nominal da bateria em ampere-hora (Ah).
- **quantidade_baterias:** Quantidade de baterias no sistema.
- **tipo_bateria:** Tipo da bateria (veja lista de valores válidos).

## Valores Válidos para o Campo `tipo_bateria`

- `chumbo_acido` - Chumbo-Ácido (Lead-Acid)
- `ion_litio` - Íon de Lítio (Li-ion)
- `niquel_cadmio` - Níquel-Cádmio (NiCd)
- `niquel_hidreto_metalico` - Níquel-Hidreto Metálico (NiMH)
- `lithium_ferro_fosfato` - Lítio-Ferro-Fosfato (LiFePO4)
- `lithium_polimero` - Lítio-Polímero (LiPo)
- `zinco_ar` - Zinco-Ar (Zn-Air)
- `niquel_ferro` - Níquel-Ferro (NiFe)
- `sodio_enxofre` - Sódio-Enxofre (NaS)
- `zinco_brometo` - Zinco-Brometo (ZnBr)
- `magnesio` - Magnésio
- `chumbo_carbono` - Chumbo-Carbono
- `fluxo_redox` - Fluxo Redox
- `aluminio_ar` - Alumínio-Ar (Al-Air)
- `lithium_enxofre` - Lítio-Enxofre (Li-S)
- `desconhecida` - Tipo de bateria desconhecido

## Exemplo de Requisição (Body)

O corpo da requisição deve ser enviado no formato JSON, contendo os seguintes parâmetros:

```json
{
  "carga_aplicada": 100,
  "tensao_bateria": 12,
  "capacidade_bateria": 50,
  "quantidade_baterias": 2,
  "tipo_bateria": "ion_litio"
}
```

## Exemplo de Resposta

```json
{
  "tempo_estimado": "01:30:00", // Tempo estimado de autonomia (HH:MM:SS)
  "tensao_corte": 10.5, // Tensão mínima de corte da bateria em volts (V)
  "mensagem": "Cálculo realizado com sucesso."
}
```

## Notas

- Certifique-se de enviar os valores no formato correto, utilizando ponto (" . ") como separador decimal.
- O campo `tipo_bateria` deve conter um dos valores válidos listados acima.
- A autonomia calculada pode variar devido a condições externas, como temperatura ambiente e idade das baterias.

---

---

## Endpoint - Viabilidade da Instalação CFTV

## Detalhes do Endpoint

- **Método:** POST
- **URL:** `{base_url}/api/ViabilidadeCFTV`
- **Descrição:** Substitua `{base_url}` pela URL da API fornecida pelo servidor.

## Headers Necessários

```json
{
  "Content-Type": "application/json"
}
```

## Entradas Necessárias

Os seguintes parâmetros devem ser fornecidos no corpo da requisição:

- **tensao_fonte:** Tensão da fonte de alimentação em volts (V).
- **bitola_cabo:** Bitola do cabo em milímetros quadrados (mm²).
- **distancia:** Distância entre a fonte e a câmera em metros (m).
- **tensao_camera:** Tensão mínima necessária para o funcionamento da câmera em volts (V).
- **corrente_camera:** Corrente consumida pela câmera em amperes (A).

## Valores Válidos para o Campo `bitola_cabo`

- `0` - 26AWG (0.14 mm²)
- `1` - 24AWG (0.20 mm²)
- `2` - 22AWG (0.33 mm²)
- `3` - 20AWG (0.50 mm²)
- `4` - 17AWG (1.00 mm²)
- `5` - 15AWG (1.50 mm²)
- `6` - 13AWG (2.50 mm²)
- `7` - 11AWG (4.00 mm²)

## Exemplo de Requisição (Body)

O corpo da requisição deve ser enviado no formato JSON, contendo os seguintes parâmetros:

```json
{
  "tensao_fonte": 12,
  "bitola_cabo": 5,
  "distancia": 50,
  "tensao_camera": 12,
  "corrente_camera": 0.5
}
```

## Exemplo de Resposta

A resposta será um JSON com os resultados do cálculo e a viabilidade da instalação:

```json
{
  "error": false,
  "status": 200,
  "result": {
    "resistencia_metro": "0.012",
    "resistencia_total": "1.20",
    "tensao_fornecida": "11.40",
    "distancia_maxima": "70.00",
    "viavel": true
  },
  "message": "Cálculo de viabilidade concluído com sucesso."
}
```

## Notas

- Certifique-se de usar os valores corretos para os parâmetros de entrada.
- Os cálculos assumem que o material do cabo é cobre (resistividade de 1.68e-8 Ω·m).
- A distância é considerada como ida e volta no cálculo da resistência.
- Os resultados são estimativas baseadas nos parâmetros fornecidos.

---

---

## Endpoint - Consulta de IP

## Detalhes do Endpoint

- **Método:** POST
- **URL:** `{base_url}/api/ConsultaIP`
- **Descrição:** Substitua `{base_url}` pela URL da API fornecida pelo servidor.

## Headers Necessários

```json
{
  "Content-Type": "application/json"
}
```

## Entradas Necessárias

Os seguintes parâmetros devem ser enviados no corpo da requisição:

- **ip:** Endereço IP que se deseja consultar (opcional). Se vazio, retorna informações sobre o IP público atual.

## Exemplo de Requisição (Body)

### Consulta de um IP Específico

```json
{
  "ip": "192.168.1.1"
}
```

### Consulta do IP Público Atual

```json
{
  "ip": ""
}
```

## Exemplo de Resposta

A resposta será um JSON com os resultados do cálculo e a viabilidade da instalação:

```json
{
  "error": false,
  "status": 200,
  "result": {
    "area_code": "45",
    "organization_name": "FICTIONAL TELECOM LTDA",
    "country_code": "US",
    "country_code3": "USA",
    "continent_code": "NA",
    "region": "California",
    "latitude": "34.0522",
    "longitude": "-118.2437",
    "accuracy": 4,
    "city": "Los Angeles",
    "timezone": "America/Los_Angeles",
    "asn": 12345,
    "ip": "192.168.1.1",
    "organization": "AS12345 FICTIONAL TELECOM LTDA",
    "country": "United States"
  },
  "message": "Consulta realizada com sucesso."
}
```

## Notas

- O parâmetro `ip` é opcional. Caso deixado em branco, a API consulta o IP público atual.
- A precisão dos dados retornados pode variar dependendo da base de dados utilizada.
- Certifique-se de enviar os dados no formato JSON correto.

---

---
