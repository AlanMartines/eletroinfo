<p align="center">
  <img src="https://eletroinformatica.com/public/imagens/icons/eletro_info_matriz.svg" width="180" alt="Eletro Info">
</p>

# API - Eletro Info

A API da EletroInfo oferece soluções para cálculos técnicos e consultas voltadas para profissionais das áreas de TI. Com endpoints especializados, a API é projetada para automatizar processos complexos e fornecer resultados precisos, otimizando a tomada de decisões.

![](https://img.shields.io/github/stars/AlanMartines/eletroinfo.svg) ![](https://img.shields.io/github/tag/AlanMartines/eletroinfo.svg) ![](https://img.shields.io/github/v/release/AlanMartines/eletroinfo.svg) ![](https://img.shields.io/github/issues/AlanMartines/eletroinfo.svg) ![](https://img.shields.io/badge/express-v4.21.1-green.svg) ![](https://img.shields.io/badge/node-v20.18.1-green.svg) ![](https://img.shields.io/badge/npm-v10.9.0-green.svg) ![](https://img.shields.io/github/license/AlanMartines/eletroinfo) ![](https://img.shields.io/github/downloads/AlanMartines/eletroinfo/total) ![](https://img.shields.io/github/forks/AlanMartines/eletroinfo)


## Dependências Debian (e.g. Ubuntu) 64bits

```sh
# Instalar Oracle JDK 21
cd ~;
wget https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.deb;
sudo dpkg -i jdk-21_linux-x64_bin.deb;
java -version;
```

```sh
java version "21.0.5" 2024-10-15 LTS
Java(TM) SE Runtime Environment (build 21.0.5+9-LTS-239)
Java HotSpot(TM) 64-Bit Server VM (build 21.0.5+9-LTS-239, mixed mode, sharing)
```

## Rodando a aplicação

```bash
# Ir para seu diretório home
cd ~

# Clone este repositório
git clone https://github.com/AlanMartines/eletroinfo.git ApiEletroInfo

# Acesse a pasta do projeto no terminal/cmd
cd ApiEletroInfo

# Instale as dependências
env NODE_OPTIONS=" --dns-result-order=ipv4first "
npm install --allow-root --unsafe-perm=true

# Configuração inicial
cp .env-example .env

# Baixar Swagger Codegen Cli
wget -c https://repo1.maven.org/maven2/io/swagger/codegen/v3/swagger-codegen-cli/3.0.9/swagger-codegen-cli-3.0.9.jar -O swagger-codegen-cli.jar

# Execute a aplicação
node server.js

# Manter os processos ativos a cada reinicialização do servidor
npm install pm2 -g

pm2 start pm2-process.json

pm2 startup

pm2 save

# Para remover do init script
pm2 unstartup systemd
```

# Índice

1.  [Endpoint - Cálculo de Autonomia de Nobreak](#endpoint---calculo-de-autonomia-de-nobreak)
2.  [Endpoint - Viabilidade da Instalação CFTV](#endpoint---viabilidade-da-instalacao-cftv)
3.  [Endpoint - Consulta de IP](#endpoint---consulta-de-ip)
4.  [Endpoint - Calculadora de IP (IPv4)](#endpoint---calculadora-de-ip-ipv4)
5.  [Endpoint - Calculadora de IP (IPv6)](#endpoint---calculadora-de-ip-ipv6)

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
  "tempo_estimado": "01:30:00",
  "tensao_corte": 10.5,
  "mensagem": "Cálculo realizado com sucesso."
}
```
```
Tempo estimado de autonomia (HH:MM:SS)
Tensão mínima de corte da bateria em volts (V)
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

## Endpoint - Calculadora de IP (IPv4)

## Detalhes do Endpoint

- **Método:** POST
- **URL:** `{base_url}/api/CalculadoraIPv4`
- **Descrição:** Substitua `{base_url}` pela URL da API fornecida pelo servidor.

## Headers Necessários

```json
{
  "Content-Type": "application/json"
}
```

## Entradas Necessárias

Os seguintes parâmetros devem ser enviados no corpo da requisição:

- **ipAddress**: Representa o endereço IP que será analisado.
- **subnetMask**: Deve ser informado no formato CIDR (ex.: /22) (ex.: 255.255.252.0).

# Valores Válidos para o Campo `subnetMask`

Os valores de prefixo CIDR (`/n`) e suas correspondentes máscaras de rede (Network Mask) são os seguintes:

- `/1` - 128.0.0.0
- `/2` - 192.0.0.0
- `/3` - 224.0.0.0
- `/4` - 240.0.0.0
- `/5` - 248.0.0.0
- `/6` - 252.0.0.0
- `/7` - 254.0.0.0

### Classe A

- `/8` - 255.0.0.0
- `/9` - 255.128.0.0
- `/10` - 255.192.0.0
- `/11` - 255.224.0.0
- `/12` - 255.240.0.0
- `/13` - 255.248.0.0
- `/14` - 255.252.0.0
- `/15` - 255.254.0.0

### Classe B

- `/16` - 255.255.0.0
- `/17` - 255.255.128.0
- `/18` - 255.255.192.0
- `/19` - 255.255.224.0
- `/20` - 255.255.240.0
- `/21` - 255.255.248.0
- `/22` - 255.255.252.0
- `/23` - 255.255.254.0

### Classe C

- `/24` - 255.255.255.0
- `/25` - 255.255.255.128
- `/26` - 255.255.255.192
- `/27` - 255.255.255.224
- `/28` - 255.255.255.240
- `/29` - 255.255.255.248
- `/30` - 255.255.255.252
- `/31` - 255.255.255.254
- `/32` - 255.255.255.255

Certifique-se de usar o prefixo CIDR correto conforme a necessidade de cálculo de rede.

## Exemplo de Requisição (Body)

```json
{
  "ipAddress": "192.168.100.1",
  "subnetMask": "/24"
}
```

## Exemplo de Resposta

A resposta será um JSON com os resultados do cálculo e a viabilidade da instalação:

```json
{
  "error": false,
  "status": 200,
  "result": {
    "ipAddress": "192.168.100.1",
    "networkAddress": "192.168.100.0",
    "usableIPRange": "192.168.100.1 - 192.168.100.254",
    "broadcastAddress": "192.168.100.255",
    "totalHosts": 256,
    "usableHosts": 254,
    "subnetMask": "255.255.255.0",
    "wildcardMask": "0.0.0.255",
    "binarySubnetMask": "11111111.11111111.11111111.00000000",
    "ipClass": "C",
    "cidrNotation": "/24",
    "ipType": "Private",
    "ShortIp": "192.168.100.1/24"
  },
  "message": "Cálculo realizado com sucesso."
}
```

## Notas

- Os parâmetros **ipAddress** e **subnetMask** são obrigatórios.
- Certifique-se de enviar os dados no formato JSON correto.

---

---
## Endpoint - Calculadora de IP (IPv6)

## Detalhes do Endpoint

- **Método:** POST
- **URL:** `{base_url}/api/CalculadoraIPv6`
- **Descrição:** Substitua `{base_url}` pela URL da API fornecida pelo servidor.

## Headers Necessários

```json
{
  "Content-Type": "application/json"
}
```

## Entradas Necessárias

Os seguintes parâmetros devem ser enviados no corpo da requisição:

- **ipAddress**: Representa o endereço IP que será analisado.
- **subnetMask**: Deve ser informado no formato CIDR (ex.: /64).




---

---
## Rotas

> As rota se encontra no arquivo [Insomnia.json](https://github.com/AlanMartines/eletroinfo/blob/master/Insomnia.json "Insomnia.json"), importe para seu Insomnia e desfrute da API.
