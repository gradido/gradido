<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace App\Model\Validation;

use Cake\I18n\Number;

class TransactionValidation 
{
  public static function amount($value, array $context) {
    $checkFloatVal = Number::format($value, ['locale' => 'en_GB']);
    $numberparts = preg_split('/\./', $checkFloatVal);
    //var_dump($numberparts);
    if(isset($numberparts[1]) && strlen($numberparts[1]) > 2) return false;
    
    $floatVal = floatval(Number::format($value, ['places' => 4, 'locale' => 'en_GB']));
    //echo "floatVal: $floatVal<br>";
    return $floatVal != 0.0;
  }
  
  public static function hexKey64($value, array $context) {
    if(strlen($value) != 64) return false;
    if(preg_match('/^[[:xdigit:]]*$/', $value)) {
      return true;
    }
    return false;
  }
  
  public static function alphaNumeric($value, array $context) {
    if(preg_match('/^[a-zA-Z0-9äöüÄÖÜß _-]*$/', $value)) {
      return true;
    }
    return false;
  }
}