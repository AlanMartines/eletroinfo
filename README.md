Endpoint - Cálculo de Autonomia de Nobreak
------------------------------------------

Detalhes do Endpoint
--------------------

* **Método:** POST
* **URL:** `{base_url}/AutonomiaNobreak`
* **Descrição:** Substitua `{base_url}` pela URL da API fornecida pelo servidor.

Headers Necessários
-------------------
```json
    {
        "Content-Type": "application/json",
    }
```

**Nota:** Substitua `{seu_token}` por um token válido de autenticação, se necessário.

Exemplo de Requisição (Body)
----------------------------

O corpo da requisição deve ser enviado no formato JSON, contendo os seguintes parâmetros:
```json
    {
        "carga_aplicada": 100,           // Consumo do equipamento em watts (W)
        "tensao_bateria": 12,           // Tensão nominal da bateria em volts (V)
        "capacidade_bateria": 50,       // Capacidade nominal da bateria em ampere-hora (Ah)
        "quantidade_baterias": 2,       // Quantidade de baterias no sistema
        "tipo_bateria": "ion_litio"     // Tipo da bateria (veja lista de valores válidos)
    }
```

Valores Válidos para o Campo `tipo_bateria`
-------------------------------------------

* `chumbo_acido` - Chumbo-Ácido (Lead-Acid)
* `ion_litio` - Íon de Lítio (Li-ion)
* `niquel_cadmio` - Níquel-Cádmio (NiCd)
* `niquel_hidreto_metalico` - Níquel-Hidreto Metálico (NiMH)
* `lithium_ferro_fosfato` - Lítio-Ferro-Fosfato (LiFePO4)
* `lithium_polimero` - Lítio-Polímero (LiPo)
* `zinco_ar` - Zinco-Ar (Zn-Air)
* `niquel_ferro` - Níquel-Ferro (NiFe)
* `sodio_enxofre` - Sódio-Enxofre (NaS)
* `zinco_brometo` - Zinco-Brometo (ZnBr)
* `magnesio` - Magnésio
* `chumbo_carbono` - Chumbo-Carbono
* `fluxo_redox` - Fluxo Redox
* `aluminio_ar` - Alumínio-Ar (Al-Air)
* `lithium_enxofre` - Lítio-Enxofre (Li-S)
* `desconhecida` - Tipo de bateria desconhecido

Exemplo de Resposta
-------------------
```json
    {
        "tempo_estimado": "01:30:00",  // Tempo estimado de autonomia (HH:MM:SS)
        "tensao_corte": 10.5,         // Tensão mínima de corte da bateria em volts (V)
        "mensagem": "Cálculo realizado com sucesso."
    }
```

Notas
-----

* Certifique-se de enviar os valores no formato correto, utilizando ponto (" . ") como separador decimal.
* O campo `tipo_bateria` deve conter um dos valores válidos listados acima.
* A autonomia calculada pode variar devido a condições externas, como temperatura ambiente e idade das baterias.
---
---