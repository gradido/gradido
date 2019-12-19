<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Willkommen'));
?>
<h1>Server Dashboard, nur für Admins</h1>
<div class="grd_container_small">
    <fieldset>
      <h3>Gradido ...</h3>
      <?= $this->Html->link(
              __('einzeln schöpfen'),
              ['controller' => 'TransactionCreations', 'action' => 'create'],
              ['class' => 'grd-nav-bn grd-nav-bn-large']
          );?>
      <?= $this->Html->link(
              __('viele schöpfen'),
              ['controller' => 'TransactionCreations', 'action' => 'createMulti'],
              ['class' => 'grd-nav-bn grd-nav-bn-large']
          );?>
    </fieldset>
    <?= $this->Html->link(
              __('Fehler') . ' (' . $adminErrorCount . ')',
              ['controller' => 'AdminErrors'], ['class' => 'grd-nav-bn']);
    ?>
</div>