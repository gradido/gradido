<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace App\Model\Validation;

class GenericValidation 
{ 
  public static function hexKey64($value, array $context) {
    if(strlen($value) != 64) return false;
    if(preg_match('/^[[:xdigit:]]*$/', $value)) {
      return true;
    }
    return false;
  }
  
  public static function alphaNumeric($value, array $context) {
    //if(preg_match('/^[a-zA-Z0-9äöüÄÖÜß _;:()-]\n\r*$/', $value)) {
    if(preg_match('/([<>]|&gt;|&lt;|javascript:){1,}/', $value)) {
      return false;
    }
    return true;
  }
  
  public static function email($value, array $context) {
    if(preg_match('/^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/', $value)) {
      return true;
    }
    return false;
  }
}