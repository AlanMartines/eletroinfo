<?php
if (session_status() !== PHP_SESSION_ACTIVE) {//Verificar se a sessão não já está aberta.
  session_start();
}
//
require_once('../inc/porextenso.php');
//
// leitura das datas
$dia = date('d');
$mes = date('m');
$ano = date('Y');
$semana = date('w');
 
// configuração mes
 
switch ($mes){
 
case 1: $mes = "Janeiro"; break;
case 2: $mes = "Fevereiro"; break;
case 3: $mes = "Março"; break;
case 4: $mes = "Abril"; break;
case 5: $mes = "Maio"; break;
case 6: $mes = "Junho"; break;
case 7: $mes = "Julho"; break;
case 8: $mes = "Agosto"; break;
case 9: $mes = "Setembro"; break;
case 10: $mes = "Outubro"; break;
case 11: $mes = "Novembro"; break;
case 12: $mes = "Dezembro"; break;
 
}
 
 
// configuração semana
 
switch ($semana) {
 
case 0: $semana = "Domingo"; break;
case 1: $semana = "Segunda-Feira"; break;
case 2: $semana = "Terça-Feira"; break;
case 3: $semana = "Quarta-Feira"; break;
case 4: $semana = "Quinta-Feira"; break;
case 5: $semana = "Sexta-Feira"; break;
case 6: $semana = "Sábado"; break;
 
}
?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Alan Martines</title> 
    <meta property='og:title' content='Alan Martines' />
    <meta charset="utf-8" />
    <meta name='content-language' content='pt-br' />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <link rel="icon" href="../images/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <!--- --------------------------------------------------------------------------------------------------------------------------- --->
    <meta name="description" content="Alan Martines"/>
    <meta name="author" content="Alan Martines"/>
    <meta name="keywords" content="Alan Martines" />
    <meta name="robots" content="noindex, nofollow"/>
    <!--- --------------------------------------------------------------------------------------------------------------------------- --->
    <!--- --------------------------------------------------------------------------------------------------------------- --->
    <script type="text/javascript" src="../../packages/jquery/jquery-3.5.1.js"></script>
    <!--- --------------------------------------------------------------------------------------------------------------- --->
    </head>
    <body>
<main>
<center style="font-size:16px"><strong><br>ORÇAMENTO</br></strong></center>
<br>
<p style="text-align: justify; font-size:12px; line-height: 1.5; font-family: Calibri;">
<strong>Cliente:</strong> Diadema
<br><br>
<strong>Ref.:</strong> Serviço de troca de cabos dos interfones.
<br><br>
<strong>Prezado(a):</strong> Diadema, com o mesmo alto nível de confiabilidade e parceria, submeto à vossa apreciação, minha proposta para execução dos serviços em referência;
<br><br>
Tomando como base informações colhidas no local.
<br><br>
<strong>Descrição dos serviços a serem executados:</strong><br>
1- Retirada de 48,70m2 de calçada.<br>
2- Retirada de 3,60m2 de contra piso do banheiro.<br>
3- Construção de 32m de valeta para tubulação de esgoto.<br>
4- Construção de 25m de valeta para tubulação de água fluvial.<br>
5- Instalação de 32m de tubulação para esgoto com tubo de 100mm.<br>
6- Instalação de 18m de tubulação para água fluvial com tubo de 100mm.<br>
7- Construção de 52,30m2 de calçada.<br>
8- Construção de 1 caixa de alvenaria de 40x40 para captação dos esgotos.<br>
9- Construção de 3 caixa de alvenaria de 30x30 de passagem para os esgotos.<br>
10- Instalação de uma caixa de gordura de PVC para a pia da cozinha.<br>
11- Construção de 3 caixa de alvenaria de 20x100 para captação de água fluvial.<br>
12- Instalação da parte hidráulica do banheiro da área da churrasqueira.<br>
13- Fazer 3 blocas de 200x30 para reforço dos baldrames rachados dos fundos.<br>
14- Fazer 2 baldrames de 140x30 para banheiro da área da churrasqueira.<br>
15- Troca de tubulação e fiação do padrão até o primeiro QD com cabo 16mm semirrígido.<br>
16- Troca da fiação do padrão de 10mm para cabo 16mm semirrígido<br>
16- Troca do disjuntor do padrão de 3x40A para 3x60A.<br><br>
<strong>Preço:</strong><br>
O preço proposto para execução do serviço fica no valor de R$ 8.700,00 (<?php print ucfirst(Extenso::converte('8.700,00', true, false)); ?>), material não incluso.
<br><br>
Atenciosamente,<br>
Marcos Maciel Mendonça<br>
<strong>Tel.</strong>: 0(67)9 9120-4008 / 9 9989-3488<br>
<strong>E-mail:</strong> marcao3mmm@gmail.com
<br><br>
<br><br>
<center style="font-size:12px">Campo Grande - MS, <?php echo $dia; ?> de <?php echo $mes; ?> de <?php echo $ano; ?>.</center>
<br><br>
<center style="font-size:12px">______________________________________________</center>
<center style="font-size:12px">MARCOS MACIEL MENDONÇA</center>
</p>
</main>
</body>
</html>