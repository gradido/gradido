<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$address_options = [];//__('Selbst eingeben:')];
foreach($receiverProposal as $i => $receiver) {
  //var_dump($receiver);
  array_push($address_options, [
      'text' => $receiver['name'],
      'value' => $i+1,
      'title' => $receiver['key']
  ]);
}
$this->assign('title', __('Schöpfungstransaktion'));
?>
<div class="grd_container_small">
 
  <?= $this->Form->create($creationForm) ?>
  <fieldset>
    <?= $this->Form->control('memo'); ?>
    <?= $this->Form->control('amount'); ?>
    <?= $this->Form->control('receiver', ['options' => $address_options]); ?>
    <!--<?= $this->Form->control('receiver_pubkey_hex', []) ?>-->
  </fieldset>
  <?= $this->Form->button(__('Transaktion(n) abschließen'), ['name' => 'next', 'class' => 'grd-form-bn grd-form-bn-succeed  grd_clickable grd-width-200']) ?>
  <?= $this->Form->button(__('Weitere Transaktion erstellen'), ['name' => 'add', 'class' => 'grd-form-bn grd_clickable  grd-width-200']) ?>
  <?= $this->Form->end() ?>
</div>
