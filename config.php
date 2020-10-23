<?php
//
if (session_status() !== PHP_SESSION_ACTIVE) {//Verificar se a sessão não já está aberta.
  session_start();
}
//
//https://pt.stackoverflow.com/questions/3571/qual-a-melhor-maneira-de-criar-um-sistema-de-login-com-php
//
// Time zone
setlocale(LC_TIME, 'pt_BR.utf8');
date_default_timezone_set('America/Sao_Paulo');
//
/** pasta absoluta do sistema **/
if ( !defined('ABSPAST') )
	define('ABSPAST', basename(__DIR__));
//	
/** caminho absoluto para a pasta do sistema **/
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');
//
/** caminho no server para o sistema **/
if ( !defined('BASEURL') )
	define('BASEURL', '/sistemas/');
//
/** caminho do arquivo de banco de dados **/
if ( !defined('DBAPI') )
	define('DBAPI', ABSPATH . 'inc/conexao.php');
//
//
/** caminho do arquivo de log **/
if ( !defined('LOGAPI') )
	define('LOGAPI', ABSPATH . 'logs/log.php');
//
/** caminhos dos templates de header e footer **/
define('HEADER_TEMPLATE', ABSPATH . 'inc/header.php');
define('FOOTER_TEMPLATE', ABSPATH . 'inc/footer.php');
//
?>