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

class JsonRequestClientComponent extends Component
{
  public function sendTransaction($session_id, $base64Message, $user_balance = 0) {
    if(!is_numeric($session_id)) {
      return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'session_id isn\'t numeric'];
    }
    if(!is_numeric($user_balance) || intval($user_balance) < 0) {
      return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'user_balance invalid'];
    }
    if(!$this->is_base64($base64Message)) {
      return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'base64Message contain invalid base64 characters'];
    }
    $http = new Client();
    
    $transactionbody = json_encode([
        'session_id' => $session_id,
        'transaction_base64' => $base64Message,
        'balance' => $user_balance
    ]);
    $response = $http->post($this->getLoginServerUrl() . '/checkTransaction', $transactionbody, ['type' => 'json']);
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
       return ['state' => 'error', 'type' => 'request error', 'msg' => 'server response isn\'t valid json', 'details' => $responseType];
    }
    return ['state' => 'success', 'data' => $json];
  }
  
  static public function getLoginServerUrl()
  {
    $loginServer = Configure::read('LoginServer');    
    return $loginServer['host'] . ':' . $loginServer['port'];
  }
  
  static public function is_base64($s)
  {
      return (bool) preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $s);
  }
            
}
