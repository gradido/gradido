<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
namespace App\Controller\Component;

use Cake\Controller\Component;

class GradidoNumberComponent extends Component
{
  // input can be from 0,01 or 0.01 up to big number be anything
    public function parseInputNumberToCentNumber($inputNumber) 
    {
        //$filteredInputNumber = preg_replace('/,/', '.', $inputNumber);
        $parts = preg_split('/(,|\.)/', (string)$inputNumber);
        
        $result = intval($parts[0]) * 10000;
        
        if(count($parts) == 2) {
          $result += intval($parts[1]) * 100;
        }
        return $result;
    }
    
    public function centToPrint($centAmount) 
    {
      
    }
            
}
