<?php
//
$pesquisa = isset($_POST['pesquisa']) ? ($_POST['pesquisa']) : '';
$pagina = isset($_POST['pagina']) ? ($_POST['pagina']) : '1';
$qnt_result_pg = isset($_POST['qnt_result_pg']) ? ($_POST['qnt_result_pg']) : '50';
//calcular o inicio visualização
$inicio = ($pagina * $qnt_result_pg) - $qnt_result_pg;
//
require_once('./functions.php');
//
$conn = adv::conectar(Conexao::conectar());
$listaProdutos = $conn->getAllProdutos($inicio, $qnt_result_pg, $pesquisa);
$row_pg = $conn->getTotalProdutos($pesquisa);
//
//Quantidade de pagina
$quantidade_pg = ceil($row_pg / $qnt_result_pg);
//Limitar os link antes depois
$max_links = 5;
//
if ($listaProdutos) :
require('./paginacao.php'); 
?>
<table class="table table-hover table-responsive table-dark">
  <thead class="thead-dark">
    <tr>
      <th scope="col" class="text-center">Produto</th>
      <th scope="col" class="text-center">Unidade</th>
      <th scope="col" class="text-center">Marca</th>
      <th scope="col" class="text-center">Preço</th>
      <th scope="col" class="text-center">Ação</th>
    </tr>
  </thead>
  <tbody>
<?php foreach ($listaProdutos as $Produto) : ?>
	<tr>
		<td class="text-left"><?php print $Produto->produto; ?></td>
		<td class="text-center"><?php print $Produto->unidade; ?></td>
		<td class="text-center"><?php print $Produto->marca; ?></td>
		<td class="text-center">R$<?php print number_format($Produto->preco, 2, ',', '.')?></td>
		<td class="text-center">
			<a id="btn-pro-info" class="btn btn-sm btn-secondary text-white" data-id="<?php print $Produto->ID; ?>" title="Informações" ><i class="fas fa-info-circle"></i></a>
			<a id="btn-pro-edit" class="btn btn-sm btn-info text-white" data-id="<?php print $Produto->ID; ?>" title="Editar" ><i class="fas fa-pencil-alt"></i></a>
		    <a id="btn-pro-delet" class="btn btn-sm btn-danger text-white" data-id="<?php print $Produto->ID; ?>" title="Apagar" ><i class="fas fa-trash"></i></a>
		</td>
	</tr>
<?php endforeach; ?>

</tbody>
</table>
<?php 
require('./paginacao.php');
else: 
?>
<div class="alert alert-info text-center">
  <strong>Atenção!</strong> Não foram encontrados registros!
</div>	
<?php 
endif; 
?>