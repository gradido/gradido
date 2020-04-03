<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Überweisung'));
// In a View class
$this->loadHelper('Form', [
    'templates' => 'ripple_horizontal_form',
]);
?>
<style type="text/css">
  .showcase_content_area .invalid-feedback {
    display:block;
  }
</style>
<div class="row">
  <div class="col-lg-11 col-md-12 equel-grid">
    <div class="grid">
      <p class="grid-header">Überweisen</p>
      <div class="grid-body">
        <div class="item-wrapper">
          <div class="row mb-3">
            <div class="col-lg-11 col-md-12 mx-auto">
              <?= $this->Form->create($transferRawForm) ?>
                <?= $this->Form->control('sender_privkey_hex', ['label' => __('Sender Private Key')]) ?>
                <?= $this->Form->control('sender_pubkey_hex', ['label' => __('Sender Public Key')]) ?>
                <?= $this->Form->control('receiver_pubkey_hex', ['label' => __('Empfänger Public Key')]) ?>
                <?= $this->Form->control('memo', ['label' => __('Verwendungszweck'), 'rows' => 3]) ?>
                <?= $this->Form->control('amount', ['label' => __('Betrag in GDD')]) ?>
                <?= $this->Form->button(__('Transaktion abschließen'), ['name' => 'next', 'class' => 'btn btn-sm btn-primary']) ?>
              <?= $this->Form->end() ?>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<?php // adding scripts vendor and core from ripple ui for validation effect ?>
<?= $this->Html->script(['core', 'vendor.addons']); ?>
<script type="text/javascript">
  (function ($) {
    'use strict';

    $('textarea').maxlength({
        alwaysShow: true,
        warningClass: "badge mt-1 badge-success",
        limitReachedClass: "badge mt-1 badge-danger"
    });
})(jQuery);
</script>
