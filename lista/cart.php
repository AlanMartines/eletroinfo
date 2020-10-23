<?php 
if (session_status() !== PHP_SESSION_ACTIVE) {//Verificar se a sessão não já está aberta.
  session_start();
}
//
require_once('./functions.php');
//
if(!isset($_SESSION['carrinho'])) {
	$_SESSION['carrinho'] = array();
}

function addCart($id, $quantity) {
	if(!isset($_SESSION['carrinho'][$id])){ 
		$_SESSION['carrinho'][$id] = $quantity; 
	}
}

function deleteCart($id) {
	if(isset($_SESSION['carrinho'][$id])){ 
		unset($_SESSION['carrinho'][$id]); 
	} 
}

function updateCart($id, $quantity) {
	if(isset($_SESSION['carrinho'][$id])){ 
		if($quantity > 0) {
			$_SESSION['carrinho'][$id] = $quantity;
		} else {
		 	deleteCart($id);
		}
	}
}
//
function getContentCart() {
$conn = adv::conectar(Conexao::conectar());

	$results = array();
	
	if($_SESSION['carrinho']) {
		
		$cart = $_SESSION['carrinho'];

		$products = $conn->getAllProdutosByIds(implode(',', array_keys($cart)));
		foreach($products as $product) {
			$results[] = array(
							  'ID' => $product->ID,
							  'produto' => $product->produto,
							  'marca' => $product->marca,
							  'preco' => $product->preco,
							  'quantidade' => $cart[$product->ID],
							  'subtotal' => $cart[$product->ID] * $product->preco,
						);
		}
	}
	return $results;
}
//
?>