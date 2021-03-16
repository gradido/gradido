<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//$class = 'grd-negative-currency';
$class = 'gdt-text-color';
//$title = '' . $number;
/*if($number == 0) $class = "grd-default-currency";
else if($number > 0) $class = "grd-positive-currency";*/
if($number < 0) {
  $class = 'grd-negative-currency';  
}

?><?php if(isset($raw) && true == $raw): ?>
<?= $this->Number->format(intval($number) / 100.0, ['precision' => 2]) . ' GDT';?>
<?php else : ?>
<span class="<?php echo $class;?>">
  <?= $this->Number->format(intval($number) / 100.0, ['precision' => 2]) . ' GDT';?>
</span>
<?php endif; ?>