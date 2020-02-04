<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
namespace App\Controller\Component;

use Cake\Controller\Component;
use Cake\Http\Client;
use Cake\Core\Configure;

use Datto\JsonRpc\Client as JsonRpcClient;

//App\Controller\Component\ComponentRegistry

class JsonRpcRequestClientComponent extends Component
{
  var $rpcClient = null;
  public function __construct($registry, array $config = array()) {
    parent::__construct($registry, $config);
    
    $this->rpcClient = new JsonRpcClient();
  }
  
  // @param id: if id = 0 call rand for it
   public function request($method, $params = [], $id = 0)
   {
     
     if(0 == $id) {
       $id = random_int(1, 12000);
     }
     $this->rpcClient->query($id, $method, $params);

     $message = $this->rpcClient->encode();
     return $this->sendRequest($message);
      // message: {"jsonrpc":"2.0","method":"add","params":[1,2],"id":1}
   }
   
   public function sendRequest($message) {
    $http = new Client();
    
    $response = $http->post($this->getGradidoNodeUrl(), $message, ['type' => 'json']);
    $responseStatus = $response->getStatusCode();
    if($responseStatus != 200) {
      return ['state' => 'error', 'type' => 'request error', 'msg' => 'server response status code isn\'t 200', 'details' => $responseStatus];
    }
    //$responseType = $response->getType();
    //if($responseType != 'application/json') {
//      return ['state' => 'error', 'type' => 'request error', 'msg' => 'server response isn\'t json', 'details' => $responseType];
//    }
    $json = $response->getJson();
    if($json == null) {
        //$responseType = $response->getType();
        return ['state' => 'error', 'type' => 'request error', 'msg' => 'server response isn\'t valid json'];
    }
    return $json;
    //return ['state' => 'success', 'data' => $json];
  }
   
  static public function getGradidoNodeUrl()
  {
    $gradidoNode = Configure::read('GradidoNode');    
    return $gradidoNode['host'] . ':' . $gradidoNode['port'];
  }
  
            
}


