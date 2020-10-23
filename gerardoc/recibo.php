<?php
if (session_status() !== PHP_SESSION_ACTIVE) {//Verificar se a sessão não já está aberta.
  session_start();
}
//
require_once('../inc/porextenso.php');
//
function convertem($term, $tp) {
    if ($tp == "1") $palavra = strtr(strtoupper($term),"àáâãäåæçèéêëìíîïðñòóôõö÷øùüúþÿ","ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÜÚÞß");
    elseif ($tp == "0") $palavra = strtr(strtolower($term),"ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÜÚÞß","àáâãäåæçèéêëìíîïðñòóôõö÷øùüúþÿ");
    return $palavra;
}
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
//Agora basta imprimir na tela...
//print ("$semana, $dia DE $mes DE $ano");
//
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
    <style>
            /** Define the margins of your page **/
            @page {
                margin: 3cm;
            }
            
            header {
                position: fixed;
                top: -95px;
                left: 0px;
                right: 0px;
                height: 50px;

                /** Extra personal styles **/
                /** background-color: #03a9f4; **/
                color: black;
                text-align: center;
                line-height: 35px;
                
            }

            footer {
                position: fixed; 
                bottom: -80px; 
                left: 0px; 
                right: 0px;
                height: 50px; 

                /** Extra personal styles **/
                /** background-color: #03a9f4; **/
                color: black;
                text-align: center;
                line-height: 13px;
                font-family: "Times", Times, serif;
                font-size: 12px;
            }
    </style>
    <!--- --------------------------------------------------------------------------------------------------------------- --->
    <script type="text/javascript" src="../../packages/jquery/jquery-3.5.1.js"></script>
    <!--- --------------------------------------------------------------------------------------------------------------- --->
    </head>
    <body>

<main>
            
<center style="font-size:16px"><strong><br>RECIBO DE PAGAMENTO</br></strong></center>
<br><br>
<p style="text-align: justify; font-size:14px; line-height: 1.5">
Eu, ALEX APARECIDO PEREIRA MARTINES, brasileiro, solteiro, regularmente inscrito na OAB/MS sob o nº. 21.325 com escritório profissional à Av. Rodolfo José Pinho, 88 - Jardim Bela Vista, Campo Grande - MS, CEP 79004-690,

<u>recebi de</u> <?php print convertem($cliente->nome, 1); ?>, <?php print strtolower($cliente->nacionalidade); ?>, <?php print strtolower($cliente->estadocivil); ?>, 

<?php print strtolower($cliente->profissao); ?>, portador(a) do RG/RNE nº <?php print $cliente->rg; ?>, Órgão Emissor/UF: <?php print strtoupper($cliente->org_emissor); ?>, 

Inscrito(a) no Cadastro Pessoa Física (CPF) sob o nº <?php print $cliente->cpf; ?>, residente e domiciliado(a) à <?php print $cliente->rua; ?>, <?php print strtoupper($cliente->numero); ?>, 

<?php if(!empty($cliente->complemento)): print $cliente->complemento.","; endif;?> <?php print $cliente->bairro; ?>, <?php print $cliente->cidade; ?> - <?php print $cliente->uf; ?>, 

<?php print $cliente->cep; ?>, a importância de R$ <?php print $pagamento->valorrecebido; ?> (<?php print ucfirst(Extenso::converte($pagamento->valorrecebido, true, false)); ?>), 

<u>referente</u> <?php print $pagamento->observacoes; ?>
<br><br>
Dando assim, plena quitação do valor recebido.
<br><br>
<br><br>
<center style="font-size:14px">Campo Grande - MS, <?php echo $dia; ?> de <?php echo $mes; ?> de <?php echo $ano; ?>.</center>
<br><br>
<center style="font-size:12px">______________________________________________</center>
<center style="font-size:12px">ALEX APARECIDO PEREIRA MARTINES</center>
</p>
</main>
</body>
</html>