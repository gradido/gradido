<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$cut_places = $precision - 2;
$transformAmount = $cent;
if($cut_places > 0) {
    if(isset($useCeil) && $useCeil) {
        $transformAmount = ceil($cent / pow(10, $cut_places));
    } else {
        $transformAmount = floor($cent / pow(10, $cut_places));
    }
}
if($cut_places < 0) {
    $cut_places = 0;
}
echo $transformAmount / pow(10, $precision -  $cut_places);

