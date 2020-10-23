<?php
if (session_status() !== PHP_SESSION_ACTIVE) {//Verificar se a sessão não já está aberta.
  session_start();
}
//
require_once('../config.php');
require_once(HEADER_TEMPLATE);
//
?>
<div class="row justify-content-center">
<div class="col-md-auto">
    <div class="row">
        <div class="col-md-4 text-left">
          <legend><h3>Lista</h3></legend>
    	</div>
        <div class="col-md-4 text-center">
<center>
<form class="text-center" id="lista-form" method="post" action="javascript:void(0)">
			<div class="form-group">
				<div class="input-group">
					<div class="input-group-prepend">
						<div class="input-group-text">
							<i class="fas fa-search"></i>
						</div>
					</div>
					<input type="text" class="rounded form-control text-center" name="pesquisa" id="pesquisa" placeholder="Pesquisar produto" />
				</div>
			</div>
</form>
</center>
    	</div>
    	<div class="col-md-4 text-right">
	    	<button type="button" class="btn btn-sm btn-secondary atualizar-lista"><i class="fas fa-sync-alt"></i> Atualizar</button>
    	</div>
    </div>
<div id="resultado-lista"></div>
</div>
</div>
<?php
require_once(FOOTER_TEMPLATE); 
?>