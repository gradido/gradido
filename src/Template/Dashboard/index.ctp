<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

if(isset($user)) {
  //var_dump($user);
}
$this->assign('title', __('Willkommen') . '&nbsp;' . $user['first_name'] . '&nbsp;' . $user['last_name']);
?>
  <div class="grd_container_small">
    <fieldset>
      <h3>Gradido ...</h3>
      <?= $this->Html->link(
              __('schöpfen'), 
              ['controller' => 'TransactionCreations', 'action' => 'create'], 
              ['class' => 'grd-nav-bn grd-nav-bn-large']
          ); ?>
      <a class="grd-nav-bn grd-nav-bn-large">überweisen</a>
    </fieldset>
    <fieldset class="grd-margin-top-10">
      <h3>Account ...</h3>
      <a class="grd-nav-bn" href="./account/user_delete"><?= __("löschen"); ?></a>
    </fieldset>
  </div>
