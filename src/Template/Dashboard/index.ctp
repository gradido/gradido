<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

if(isset($user)) {
  //var_dump($user);
}
?>
<div class="grd_container">
	<h1>Willkommen <?= $user['first_name'] ?>&nbsp;<?= $user['last_name'] ?></h1>
  <div class="grd_container_small">
    <fieldset>
      <h3>Geld ...</h3>
      <?= $this->Html->link(__('schöpfen'), ['controller' => 'TransactionCreations', 'action' => 'create'], ['class' => 'grd_bn grd_bg-bn']); ?>
      <a class="grd_bn grd_bg-bn">überweisen</a>
    </fieldset>
  </div>
</div>
<div class="grd-time-used">
  <?=  round($timeUsed * 1000.0, 4) ?> ms
</div>