<?php
//
require_once('../login/verifica_sessao.php');
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
$listaUnidades = $conn->getAllUnidades($inicio, $qnt_result_pg, $pesquisa);
$row_pg = $conn->getTotalUnidades($pesquisa);
//
//Quantidade de pagina
$quantidade_pg = ceil($row_pg / $qnt_result_pg);
//Limitar os link antes depois
$max_links = 5;
//
if ($listaUnidades) :
require('./paginacao.php'); 
?>
<table class="table table-hover table-responsive table-dark">
  <thead class="thead-dark">
    <tr>
      <th scope="col" class="text-center">Descricao</th>
      <th scope="col" class="text-center">Unidade</th>
      <th scope="col" class="text-center">Adicionado em</th>
      <th scope="col" class="text-center">Ação</th>
    </tr>
  </thead>
  <tbody>
<?php foreach ($listaUnidades as $Unidade) : ?>
	<tr>
		<td class="text-left"><?php print $Unidade->descricao; ?></td>
		<td class="text-center"><?php print $Unidade->termo; ?></td>
		<td class="text-center"  data-sort="<?php print $Unidade->created; ?>"><?php print date('d/m/Y H:i:s',strtotime($Unidade->created)); ?></td>
		<td class="text-center">
			<a id="btn-pro-info" class="btn btn-sm btn-secondary text-white" data-id="<?php print $Unidade->ID; ?>" title="Informações" ><i class="fas fa-info-circle"></i></a>
			<a id="btn-pro-edit" class="btn btn-sm btn-info text-white" data-id="<?php print $Unidade->ID; ?>" title="Editar" ><i class="fas fa-pencil-alt"></i></a>
		    <a id="btn-pro-delet" class="btn btn-sm btn-danger text-white" data-id="<?php print $Unidade->ID; ?>" title="Apagar" ><i class="fas fa-trash"></i></a>
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