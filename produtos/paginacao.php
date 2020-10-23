<?php
if($row_pg > $qnt_result_pg):

?>
<nav aria-label="paginacao">
<ul class="pagination justify-content-center pagination-sm">
	<button type="button" id="" class="btn btn-sm btn-success pagina" data-pagina="1" data-qnt_result_pg="<?php print $qnt_result_pg; ?>">Primeira</button>
	<?php
	for ($pag_ant = $pagina - $max_links; $pag_ant <= $pagina - 1; $pag_ant++) :
		if($pag_ant >= 1):
	?>
			<li class="page-item">
				<button type="button" class="btn btn-sm btn-light pagina" data-pagina="<?php print $pag_ant; ?>" data-qnt_result_pg="<?php print $qnt_result_pg; ?>"><?php print $pag_ant; ?></button>
			</li>
	<?php
		endif;
	endfor;
	?>
	<li class="page-item active">
		<span class="page-link">
			<?php print $pagina; ?>
		</span>
	</li>
	<?php
	for ($pag_dep = $pagina + 1; $pag_dep <= $pagina + $max_links; $pag_dep++) :
		if($pag_dep <= $quantidade_pg) :
	?>
			<li class="page-item">
				<button type="button" class="btn btn-sm btn-light pagina" data-pagina="<?php print $pag_dep; ?>" data-qnt_result_pg="<?php print $qnt_result_pg; ?>"><?php print $pag_dep; ?></button>
			</li>
	<?php
		endif;
	endfor;
	?>
	<button type="button" class="btn btn-sm btn-success pagina" data-pagina="<?php print $quantidade_pg; ?>" data-qnt_result_pg="<?php print $qnt_result_pg; ?>">Última</button>
</ul>
</nav>
<?php
endif;
?>