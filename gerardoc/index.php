<?php
if (session_status() !== PHP_SESSION_ACTIVE) {//Verificar se a sessão não já está aberta.
  session_start();
}
//
        $strDOC =  (isset($_GET["Doc"])) ? $_GET["Doc"] : '';
        $ch = curl_init("https://eletroinfo.tk/sistemas/gerardoc/$strDOC.php");
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $html = curl_exec($ch);      
        curl_close($ch);
        //echo $output;

require_once("./dompdf/autoload.inc.php");

// referenciando o namespace do dompdf

use Dompdf\Dompdf;

// instanciando o dompdf

$dompdf = new Dompdf();

//lendo o arquivo HTML correspondente

// $html = file_get_contents("procuracao.html");

//inserindo o HTML que queremos converter

$dompdf->loadHtml($html);

//Definindo o tipo de fonte padrão

//$dompdf->set_option('defaultFont', 'Courier');

//Definindo o papel e a orientação
//Define o tipo de papel de impressão (opcional)
//tamanho (A4, A3, A2, etc)
//oritenação do papel:'portrait' (em pé) ou 'landscape' (deitado)

$dompdf->setPaper('A4', 'portrait');

// Renderizando o HTML como PDF

$dompdf->render();

// Enviando o PDF para o browser

// Exibe
$dompdf->stream(
    "$strDOC.pdf", // Nome do arquivo de saída
    array(
        "Attachment" => false // Para download, altere para true
    ));

?>