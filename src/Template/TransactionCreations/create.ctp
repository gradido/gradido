<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$address_options = [__('Selbst eingeben:')];
foreach($receiverProposal as $i => $receiver) {
  //var_dump($receiver);
  array_push($address_options, [
      'text' => $receiver['name'],
      'value' => $i+1,
      'title' => $receiver['key']
  ]);
}
?>
<div class="grd_container">
	<h1><?= __('Schöpfungstransaktion') ?></h1>
  <div class="grd_container_small">
    <?= $this->Form->create($creationForm) ?>
    <fieldset>
      <?= $this->Form->control('memo'); ?>
      <?= $this->Form->control('amount'); ?>
      <?= $this->Form->control('receiver', ['options' => $address_options]); ?>
      <?= $this->Form->control('receiver_pubkey_hex', []) ?>
    </fieldset>
    <?= $this->Form->button(__('Bestätigen')) ?>
    <?= $this->Form->end() ?>
  </div>
</div>
<div class="grd-time-used">
  <?=  round($timeUsed * 1000.0, 4) ?> ms
</div>