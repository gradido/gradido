<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

?>
<?php if(isset($errors) && count($errors) > 0) : ?>
<div class="grd-alert-color">
  <ul>
    <?php foreach($errors as $error) : ?>
    <li>
      <?= var_dump($error); ?>
    </li>
    <?php endforeach; ?> 
  </ul>
</div>
<?php endif; ?>

<?= $this->Form->create() ?>
<?= $this->Form->control('base64', ['type'=> 'textarea', 'rows' => '5', 'cols' => 40]) ?>
<?= $this->Form->submit(); ?>
<?= $this->Form->end() ?>

<?php if(isset($transaction)) : ?>
<?php 
$body = $transaction;//$transaction->getTransactionBody();
?>
<table>
  <tr><th>Type</th><td><?= $body->getTransactionTypeName() ?></td></tr>
  <tr><th>Memo</th><td<<?= $body->getMemo() ?></td></tr>
</table>
<?= var_dump($transaction); ?>
<?php endif; ?>
