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
		<td class="text-center">R$<?php print $Produto->preco; ?></td>
		<td class="text-center">
			<a class="btn btn-sm btn-primary" href="./carrinho.php?acao=add&id=<?php print $Produto->ID; ?>" title="Adicionar"><i class="fas fa-plus"></i> Adicionar</a>
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