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
//
require_once('./functions.php');
//
if(!isset($_SESSION['carrinho'])) {
	$_SESSION['carrinho'] = array();
}

function getContentCart() {
$conn = adv::conectar(Conexao::conectar());

	$results = array();
	
	if($_SESSION['carrinho']) {
		
		$cart = $_SESSION['carrinho'];

		$products = $conn->getAllProdutosByIds(implode(',', array_keys($cart)));
		foreach($products as $product) {
			$results[] = array(
							  'ID' => $product->ID,
							  'produto' => $product->produto,
							  'marca' => $product->marca,
							  'preco' => $product->preco,
							  'quantidade' => $cart[$product->ID],
							  'subtotal' => $cart[$product->ID] * $product->preco,
						);
		}
	}
	return $results;
}
//

	$resultsCarts = getContentCart();

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
    </head>
    <body>
<main>
<center style="font-size:16px"><strong><br>LISTA DE MATERIAIS</br></strong></center>
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
<center style="font-size:12px">
<?php
if($resultsCarts) :
	print "Com intens";
else:
	print "Sem intens";
endif;
?>
</center>
<br><br>
<div style="font-size:12px">
Atenciosamente,<br>
Marcos Maciel Mendonça<br>
<strong>Tel.</strong>: 0(67)9 9120-4008 / 9 9989-3488<br>
<strong>E-mail:</strong> marcao3mmm@gmail.com
</div>
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