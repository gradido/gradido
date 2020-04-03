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
  public function sendTransaction($session_id, $base64Message, $user_balance = 0) {
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
        'balance' => $user_balance
    ]), '/checkTransaction');
      
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
  
  public function getUsers($session_id, $searchString)
  {
    if($searchString == "") {
        return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'search string is empty'];
    }
    if(!is_numeric($session_id)) {
      return ['state' => 'error', 'type' => 'parameter error', 'msg' => 'session_id isn\'t numeric'];
    }
    
    return $this->sendRequest(json_encode([
                'session_id' => $session_id,
                'search' => $searchString
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
    $fullUrl = $this->getGDTServerUrl() . DS . $url;
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
  
  static public function getLoginServerUrl()
  {
    $loginServer = Configure::read('LoginServer');    
    return $loginServer['host'] . ':' . $loginServer['port'];
  }
  
  static public function getGDTServerUrl()
  {
    $gdtServer = Configure::read('GDTServer');
    return $gdtServer['host'];
  }
  
  static public function is_base64($s)
  {
      return (bool) preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $s);
  }
            
}
