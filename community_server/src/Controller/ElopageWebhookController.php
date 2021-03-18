<?php
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace App\Controller;

use App\Controller\AppController;

class ElopageWebhookController extends AppController
{
    public function initialize()
    {
        parent::initialize();
    
        $this->Auth->allow(['put']);

    }
  
    public function put()
    {
        $this->autoRender = false;
        $data = $this->request->getData();
        $response = $this->response->withType('text/plain');
        
        $dataString = http_build_query($data);
        //$this->recursiveArrayToString($data, $dataString);
        // %5B => [
        // %5D => ]
        $dataString = preg_replace(['/\%5B/', '/\%5D/'], ['[', ']'], $dataString);
        //var_dump($dataString);
        
        //2020-02-27T13:52:32+01:00
        $dateString = date('c');
        $fh = fopen('/etc/grd_login/php_elopage_requests.txt', 'a');
        if($fh === FALSE) {
          return $response->withStringBody('400 ERROR');
        }
        fwrite($fh, $dateString);
        fwrite($fh, "\n");
        fwrite($fh, $dataString);
        fwrite($fh, "\n");
        fclose($fh);
        
        
        return $response->withStringBody('200 OK');
        
    }
}
