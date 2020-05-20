<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$class = '';
if($number < 0) {
  $class = 'grd-negative-currency';
}

?><?php if(isset($raw) && true == $raw): ?>
<?= 'Kontoübersicht (' . $this->Number->format(intval($number) / 10000.0, ['precision' => 2]) . ' GDD)';?>
<?php else : ?>
<span class="<?php echo $class;?>">
  <?= 'Kontoübersicht (' . $this->Number->format(intval($number) / 10000.0, ['precision' => 2]) . ' GDD)';?>
</span>
<?php endif; ?>