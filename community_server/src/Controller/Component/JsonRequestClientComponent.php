<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
namespace App\Controller\Component;

use App\Model\Validation\GenericValidation;

use Cake\Controller\Component;
use Cake\Http\Client;
use Cake\Core\Configure;

class JsonRequestClientComponent extends Component
{
  public function sendTransaction($session_id, $base64Message, $user_balance = 0, $auto_sign = false, $blockchain_type = 'mysql') {
    if(!is_numeric($session_id)) {
      return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'session_id isn\'t numeric'];
    }
    if(!is_numeric($user_balance) || intval($user_balance) < 0) {
      return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'user_balance invalid'];
    }
    if(is_array($base64Message)) {
      foreach($base64Message as $singleMessage) {
        if(!$this->is_base64($singleMessage)) {
          return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'at least one base64Message contain invalid base64 characters'];
        }
      }
    } else if(!$this->is_base64($base64Message)) {
      return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'base64Message contain invalid base64 characters'];
    }
    
    return $this->sendRequest(json_encode([
        'session_id' => $session_id,
        'transaction_base64' => $base64Message,
        'balance' => $user_balance,
        'auto_sign' => $auto_sign,
        'blockchain_type' => $this->blockchainType
    ]), '/checkTransaction');
      
  }
  
  public function findePublicKeyForEmailHash($emailHash) {
    //'ask' = ['account_publickey' => '<email_blake2b_base64>']
    $results = $this->sendRequestLoginServerNeighbors(json_encode(['ask' => ['account_publickey' => $emailHash]]), 'search');
  }
  
  public function getRunningUserTasks($email)
  {
      if($email == "") {
        return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'email is empty'];
      }
      if(!GenericValidation::email($email, [])) {
        return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'email is invalid'];
      }
      
      return $this->sendRequest(json_encode([
          'email' => $email
      ]), '/getRunningUserTasks');
  }
  
  public function getUsers($session_id, $searchString, $accountState)
  {
    if($searchString == "") {
        return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'search string is empty'];
    }
    if(!is_numeric($session_id)) {
      return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'session_id isn\'t numeric'];
    }
    
    return $this->sendRequest(json_encode([
                'session_id' => $session_id,
                'search' => $searchString,
                'account_state' => $accountState,
            ]), '/getUsers');
  }
  
  public function sendRequest($transactionBody, $url_last_part) {
    $http = new Client();
    
    $response = $http->post($this->getLoginServerUrl() . $url_last_part, $transactionBody, ['type' => 'json']);
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
    return ['state' => 'success', 'data' => $json];
  }
  
  public function sendRequestGDT($transactionBody, $url) {
    
    $http = new Client();
    $gdtServerHost = $this->getGDTServerUrl();
    if(!$gdtServerHost) {
      return ['state' => 'warning', 'msg' => 'gdt server not configured'];
    }
    $fullUrl = $gdtServerHost . DS . $url;
    $response = $http->post($this->getGDTServerUrl() . DS . $url, $transactionBody, ['type' => 'json']);
    $responseStatus = $response->getStatusCode();
    if($responseStatus != 200) {
      return [
          'state' => 'error', 
          'type' => 'request error', 
          'msg' => 'server response status code isn\'t 200', 
          'details' => $responseStatus,
          'fullUrl' => $fullUrl
      ];
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
    return ['state' => 'success', 'data' => $json];
  }
  
  public function sendRequestLoginServerNeighbors($transactionBody, $url) {
    
    $http = new Client();
    if(!Configure::check('NeighborLoginServers')) {
      return ['state' => 'warning', 'msg' => 'no neighbor server configured'];
    }
    $nServers = Configure::read('NeighborLoginServers');
    $results = ['errors' => [], 'data' => []];
    foreach($nServers as $nServer) {
      $full_url = $nServer['host'] . ':' . $nServer['port'] . '/' . $url;
      $response = $http->post($full_url, $transactionBody, ['type' => 'json']);
      $responseStatus = $response->getStatusCode();
      if($responseStatus != 200) {
        $results['errors'][] = [
            'state' => 'error', 
            'type' => 'request error', 
            'msg' => 'server response status code isn\'t 200', 
            'details' => $responseStatus,
            'fullUrl' => $full_url
        ];
        continue;
      }
      $json = $response->getJson();
      if($json == null) {
        //$responseType = $response->getType();
        $results['errors'][] = ['state' => 'error', 'type' => 'request error', 'msg' => 'server response isn\'t valid json'];
        continue;
      }
      $results['data'][] = $json;
    }
    return $results;
  }
  
  static public function getLoginServerUrl()
  {
    $loginServer = Configure::read('LoginServer');    
    return $loginServer['host'] . ':' . $loginServer['port'];
  }
  
  static public function getGDTServerUrl()
  {
    $gdtServer = Configure::read('GDTServer');
    if(isset($gdtServer['host'])) {
      return $gdtServer['host'];
    } 
    return false;
  }
  
  static public function is_base64($s)
  {
      return (bool) preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $s);
  }
            
}
