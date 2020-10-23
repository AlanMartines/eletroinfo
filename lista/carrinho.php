<?php 
if (session_status() !== PHP_SESSION_ACTIVE) {//Verificar se a sessão não já está aberta.
  session_start();
}
//
require_once('../config.php');
require_once(HEADER_TEMPLATE);
//
require_once "./cart.php";

	if(isset($_GET['acao']) && in_array($_GET['acao'], array('add', 'del', 'up'))) {
		
		if($_GET['acao'] == 'add' && isset($_GET['id']) && preg_match("/^[0-9]+$/", $_GET['id'])){ 
			addCart($_GET['id'], 1);			
		}

		if($_GET['acao'] == 'del' && isset($_GET['id']) && preg_match("/^[0-9]+$/", $_GET['id'])){ 
			deleteCart($_GET['id']);
		}

		if($_GET['acao'] == 'up'){ 
			if(isset($_POST['prod']) && is_array($_POST['prod'])){ 
				foreach($_POST['prod'] as $id => $qtd){
						updateCart($id, $qtd);
				}
			}
		} 
		//header('location: carrinho.php');
	}

	$resultsCarts = getContentCart();

?>
<div class="row justify-content-center">
   <div class="col-md-auto">
      <form class="text-center" id="lista-form" method="post" action="./carrinho.php?acao=up">
         <div class="row">
            <div class="col-md-4 text-left">
               <a class="btn btn-sm btn-primary" href="index.php"><i class="fas fa-plus"></i> Adicionar itens</a>
            </div>
            <div class="col-md-4 text-center">
               <button type="button" class="btn btn-sm btn-success para-excel" title="Exportar para excel" ><i class="fas fa-file-excel"></i></button>
               <button type="button" class="btn btn-sm btn-success para-pdf" title="Exportar para pdf"><i class="fas fa-file-pdf"></i></button>
               <button type="button" class="btn btn-sm btn-success para-png" title="Exportar para png"><i class="fas fa-file-image"></i></button>
            </div>
            <div class="col-md-4 text-right">
               <button type="submit" class="btn btn-sm btn-primary"><i class="fas fa-sync-alt"></i> Atualizar lista</button>
            </div>
         </div>
         <hr>
         <table class="table table-hover table-responsive table-dark" id="custon-lista">
            <thead class="thead-dark">
               <tr>
                  <th scope="col" class="text-center">Produto</th>
                  <th scope="col" class="text-center">Marca</th>
                  <th scope="col" class="text-center">Quantidade</th>
                  <th scope="col" class="text-center">Ação</th>
               </tr>
            </thead>
            <tbody>
               <?php
                  if($resultsCarts) : 
                  $count = 0;
                  foreach($resultsCarts as $result) : 
                  ?>
               <tr>
                  <td class="text-left"><?php print $result['produto']; ?></td>
                  <td class="text-center"><?php print $result['marca']; ?></td>
                  <td class="text-center">
                     <span class="dec button" data-id="<?php print $result['ID']?>">
                     <i class="fas fa-minus-circle" title="Subtrair"></i>
                     </span>
                     
                     <input type="text" class="rounded form-control-sm text-center" id="prod[<?php print $result['ID']?>]" name="prod[<?php print $result['ID']?>]" value="<?php print $result['quantidade']; ?>" size="1" />
                     
                     <span class="inc button" data-id="<?php print $result['ID']?>">
                     <i class="fas fa-plus-circle" title="Adicionar"></i>
                     </span>
                  </td>
                  <td class="text-center"><a  class="btn btn-sm btn-danger" href="./carrinho.php?acao=del&id=<?php print $result['ID']?>">Remover</a></td>
               </tr>
               <?php 
                  $count+=  $result['quantidade'];
                  endforeach;
                  ?>
               <tr>
                  <td colspan="2" class="text-right">
                     <b>Total de itens: </b>
                  </td>
                  <td colspan="1" class="text-center"><?php print $count; ?></td>
                  <td colspan="1"></td>
               </tr>
               <?php endif; ?>
            </tbody>
         </table>
      </form>
   </div>
</div>
<?php 
require_once(FOOTER_TEMPLATE); 
?>