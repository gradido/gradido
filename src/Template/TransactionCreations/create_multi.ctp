<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/*$address_options = [];//__('Selbst eingeben:')];
foreach($receiverProposal as $i => $receiver) {
  //var_dump($receiver);
  array_push($address_options, [
      'text' => $receiver['name'],
      'value' => $i+1,
      'title' => $receiver['key']
  ]);
}*/
$this->assign('title', __('Schöpfungstransaktion'));
?>
<style type="text/css">
  input[type='checkbox'] {
    width:25px;
  }
  
  .grd_big_checkbox {
    border:1px dotted grey;
    margin-bottom:5px;
  }
  
  .grd_smaller {
    font-size:smaller;
    color:blue;
  }
  
</style>
<div class="grd_container_small">
  
  <?= $this->Form->create($creationForm) ?>
  <fieldset>
    <?= $this->Form->control('memo'); ?>
    <?= $this->Form->control('amount'); ?>
    <?php foreach($possibleReceiver as $possibleReceiver) : ?>
    <div class="grd_big_checkbox">
      <?= $this->Form->checkbox('user[' .$possibleReceiver['id'] . ']',  ['hiddenField' => false]); ?>
      <?= $possibleReceiver['name'] ?>   
        <?php if($possibleReceiver['email'] != '') : ?>
          &lt;<?= $possibleReceiver['email'] ?>&gt;
        <?php endif; ?><br>
        <?php if($possibleReceiver['amount'] != 0) : ?>
          <span class="grd_smaller">
            In diesem Monat bereits geschöpft: <?= $this->element('printGradido', ['number' => $possibleReceiver['amount']]);?></span>
        <?php endif; ?>
          <br>
    </div>
    <?php endforeach; ?>
    <!--<?= $this->Form->control('receiver_pubkey_hex', []) ?>-->
  </fieldset>
  <?= $this->Form->button(__('Transaktion(n) abschließen'), ['name' => 'next', 'class' => 'grd-form-bn grd-form-bn-succeed  grd_clickable grd-width-200']) ?>
  <?= $this->Form->button(__('Weitere Transaktion erstellen'), ['name' => 'add', 'class' => 'grd-form-bn grd_clickable  grd-width-200']) ?>
  <?= $this->Form->end() ?>
</div>
