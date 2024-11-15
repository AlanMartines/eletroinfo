<p align="center">
  <img src="./public/imagens/whatsapp-bot.png" width="150" alt="My Whats">
</p>

# API - My WhatsApp (Rotas)

#### Instale o NodeJs Debian (e.g. Ubuntu)

###### Instalar

```bash
# Ir para seu diretório home
cd ~

# Recuperar o script de instalação para sua versão de preferência
curl -sL https://deb.nodesource.com/setup_16.x | sudo bash -

# Instalar o pacote Node.js
sudo apt install -y git nodejs yarn gcc g++ make vim curl python python3

# Remover pacotes que não são mais necessários
sudo apt autoremove -y
```

#### Instale o NodeJs CentOS 7/8 64bits

###### Instalar

```bash
# Ir para seu diretório home
cd ~

# Recuperar o script de instalação para sua versão de preferência
curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -

# Instalar o pacote Node.js
sudo yum install -y git nodejs yarn gcc g++ tar make vim curl python python3

# Remover pacotes que não são mais necessários
sudo yum autoremove -y
```

#### Instale o NodeJs Alpine 64bits

###### Instalar

```bash
# Ir para seu diretório home
cd ~

# Instalar o pacote Node.js
apk add --update nodejs nodejs-npm
```

## Rodando a aplicação

```bash
# Ir para seu diretório home
cd ~

# Clone este repositório
git clone https://github.com/AlanMartines/connectzap-api-node-webhook.git ApiRoutesWebhook

# Acesse a pasta do projeto no terminal/cmd
cd ApiRoutesWebhook

# Instale as dependências
npm install --allow-root --unsafe-perm=true

# Configuração inicial
cp .env-example .env

# Execute a aplicação
node server.js

# Manter os processos ativos a cada reinicialização do servidor
npm install pm2 -g

pm2 start server.js --name ApiRoutesWebhook --watch

pm2 save

pm2 startup

sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ${USER} --hp /home/${USER}

# Para remover do init script
pm2 unstartup systemd

# O servidor iniciará na porta:9001

# Pronto, escaneie o código QR-Code do Whatsapp e aproveite!
```

## Configuração inicial do arquivo ".env-example"

```sh
NODE_EN=production
#
# Defina o HOST aqui caso voce utilize uma VPS deve ser colocado o IP da VPS
# Exemplos:
# HOST=204.202.54.2 => IP da VPS, caso esteja usando virtualização via hospedagem
# HOST=10.0.0.10 => IP da VM, caso esteja usando virtualização
# HOST=localhost => caso esteja usando na sua proprima maquina local
HOST=localhost
#
# Defina o numero da porta a ser usada pela API.
PORT=8010
#
# Defina o dominio SSL.
DOMAIN_SSL=
#
```


## Instalar o certbot Debian (e.g. Ubuntu) 64bits

```barsh
# Instalar Python e cerbot
sudo apt install -y certbot python3-certbot-nginx

# Renew certificate interactively
sudo certbot renew
```

## Instalar o certbot CentOS 7/8 64bits

```barsh
# Instalar Python e cerbot
sudo yum install -y epel-release

# Instalar plugin para nginex
sudo yum install -y certbot-nginx

# Renew certificate interactively
sudo certbot renew
```

## Instalar o certbot Alpine 64bits

```barsh
# Instalar Python
apk add --update python3 py3-pip

# Instalar cerbot
apk add certbot

# Instalar plugin para nginex
pip install certbot-nginx

# Renew certificate interactively
certbot renew
```

## Criar o certificado SSL para domínios https Debian (e.g. Ubuntu) 64bits e CentOS 7/8 64bits

```barsh
sudo certbot certonly --manual --force-renewal -d *.yourdomain.net -d yourdomain.net \
--agree-tos --no-bootstrap --manual-public-ip-logging-ok --preferred-challenges dns-01 \
--server https://acme-v02.api.letsencrypt.org/directory
```

## Criar o certificado SSL para domínios https Alpine 64bits

```barsh
certbot certonly --manual --force-renewal -d *.yourdomain.net -d yourdomain.net \
--agree-tos --no-bootstrap --manual-public-ip-logging-ok --preferred-challenges dns-01 \
--server https://acme-v02.api.letsencrypt.org/directory
```

## Em desenvolvimento

Este projeto se encontra em desenvolvimento, então pode conter erros.


## License

[MIT](https://choosealicense.com/licenses/mit/)
