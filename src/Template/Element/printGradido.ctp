<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//$class = 'grd-negative-currency';
$class = '';
//$title = '' . $number;
/*if($number == 0) $class = "grd-default-currency";
else if($number > 0) $class = "grd-positive-currency";*/

?>
<span class="<?php echo $class;?>">
  <?= $this->Number->format(intval($number) / 10000.0, ['precision' => 2]) . ' GDD';?>
</span>