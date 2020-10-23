<?php
ini_set("display_errors",1);
ini_set("display_startup_erros",1);
error_reporting(E_ALL);
//
if (session_status() !== PHP_SESSION_ACTIVE) {//Verificar se a sessão não já está aberta.
  session_start();
}
//
require_once('../login/verifica_sessao.php');
require_once('./functions.php');









?>