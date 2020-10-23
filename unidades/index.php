<?php
if (session_status() !== PHP_SESSION_ACTIVE) {//Verificar se a sessão não já está aberta.
  session_start();
}
//
require_once('../login/verifica_sessao.php');
require_once('../config.php');
require_once(HEADER_TEMPLATE);
//
?>
<div class="row justify-content-center">
<div class="col-md-auto">
    <div class="row">
        <div class="col-md-4 text-left">
          <legend><h3>Unidades</h3></legend>
    	</div>
        <div class="col-md-4 text-center">
<center>
<form class="text-center" id="pesquisa-form" method="post" action="javascript:void(0)">
			<div class="form-group">
				<div class="input-group">
					<div class="input-group-prepend">
						<div class="input-group-text">
							<i class="fas fa-search"></i>
						</div>
					</div>
					<input type="text" class="rounded form-control text-center input-sm" name="pesquisa" id="pesquisa" placeholder="Pesquisar unidade" />
				</div>
			</div>
</form>
</center>
    	</div>
    	<div class="col-md-4 text-right">
	    	<button type="button" class="btn btn-sm btn-primary add-unidade" title="Nova Unidade"><i class="fas fa-plus"></i> Novo</a>
	    	<button type="button" class="btn btn-sm btn-secondary atualizar-unidades" title="Atualizar"><i class="fas fa-sync-alt"></i> Atualizar</button>
    	</div>
    </div>
<div id="resultado-unidades"></div>
</div>
</div>
<?php
require_once(FOOTER_TEMPLATE); 
?>