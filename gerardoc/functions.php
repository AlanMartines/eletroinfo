<?php
/* Informa o nível dos erros que serão exibidos */
error_reporting(E_ALL);
 
/* Habilita a exibição de erros */
ini_set("display_errors", 1);
// http://www.devwilliam.com.br/php/crud-no-php-com-pdo-e-mysql
// http://bootboxjs.com/
require_once('../config.php');
require_once(DBAPI);

class adv{
  private $pdo = null;  
  private static $crudAdv = null; 
  private static  $strTabela = null;
  private function __construct($conexao){  
    $this->pdo = $conexao;  
  }
  
  public static function conectar($conexao){   
   if (!isset(self::$crudAdv)):    
    self::$crudAdv = new adv($conexao);   
   endif;   
   return self::$crudAdv;    
  }
   //
  public function getAllProdutos($inicio=null, $maximo=null, $pesquisa=null){
   try{
    $sql = "SELECT * FROM produtos WHERE produto LIKE '%$pesquisa%' ORDER BY produto ASC LIMIT $inicio, $maximo";
    //print $sql;
    $stm = $this->pdo->prepare($sql);   
    $stm->execute();   
    $dados = $stm->fetchAll(PDO::FETCH_OBJ);   
    return $dados;   
     //echo "<script>alert('Registro carregado com sucesso')</script>";
    }catch(PDOException $erro){   
     //echo "<script>alert('Erro na linha: {$erro->getLine()}')</script>";
    }   
  }
   //
  public function getAllProdutosByIds($ids=null){
   try{
    $sql = "SELECT * FROM produtos WHERE ID IN (".$ids.") ORDER BY produto ASC";
    //print $sql;
    $stm = $this->pdo->prepare($sql);   
    $stm->execute();   
    $dados = $stm->fetchAll(PDO::FETCH_OBJ);   
    return $dados;   
     //echo "<script>alert('Registro carregado com sucesso')</script>";
    }catch(PDOException $erro){   
     //echo "<script>alert('Erro na linha: {$erro->getLine()}')</script>";
    }   
  }
  //
  //
  public function getTotalProdutos($pesquisa=null){
   try{
    $sql = "SELECT * FROM produtos WHERE produto LIKE '%$pesquisa%'";
    //print $sql;
    $stm = $this->pdo->prepare($sql);   
    $stm->execute();   
    $linha = $stm->rowCount(PDO::FETCH_OBJ);
    return $linha;   
   }catch(PDOException $erro){   
    //echo "<script>alert('Erro na linha: {$erro->getLine()}')</script>"; 
   }   
  }
//
 }
 ?>