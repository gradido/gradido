<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->loadHelper('Form', [
    'templates' => 'horizontal_form',
]);
$now = new \DateTime;
?>
<?php if(isset($errors) && count($errors) > 0) : ?>
<div class="alert-color">
  <ul>
    <?php foreach($errors as $error) : ?>
    <li>
      <?= var_dump($error); ?>
    </li>
    <?php endforeach; ?> 
  </ul>
</div>
<?php endif; ?>

<div class="action-form">
    <p class="form-header"><?= __('Creation Transaction') ?></p>
    <div class="form-body">
        <?= $this->Form->create() ?>
        <?= $this->Form->control('type', ['type' => 'hidden', 'value' => 'creation']) ?>
        <?= $this->Form->control('target_public_key', ['type'=> 'text']) ?>
        <?= $this->Form->control('target_date', ['type'=> 'text', 'placeholder' => 'yyyy-mm-dd hh:ii:ss', 'default' => $now->format('Y-m-d H:i:s')]) ?>
        <?= $this->Form->control('amount', ['type'=> 'number']) ?>
        <?= $this->Form->control('memo', ['type'=> 'textarea', 'rows' => '8', 'cols' => 40]) ?>
        <?= $this->Form->control('signer_public_key', ['type' => 'text']) ?>
        <?= $this->Form->control('signer_private_key', ['type'=> 'text']) ?>
        <?= $this->Form->submit(); ?>
        <?= $this->Form->end() ?>
    </div>
</div>
<div class="action-form">
    <p class="form-header"><?= __('Transfer Transaction') ?></p>
    <div class="form-body">
        <?= $this->Form->create() ?>
        <?= $this->Form->control('type', ['type' => 'hidden', 'value' => 'transfer']) ?>
        <?= $this->Form->control('sender_public_key', ['type'=> 'text']) ?>
        <?= $this->Form->control('receiver_public_key', ['type'=> 'text']) ?>
        <?= $this->Form->control('amount', ['type'=> 'number']) ?>
        <?= $this->Form->control('memo', ['type'=> 'textarea', 'rows' => '8', 'cols' => 40]) ?>
        <?= $this->Form->control('signer_public_key', ['type' => 'text']) ?>
        <?= $this->Form->control('signer_private_key', ['type'=> 'text']) ?>
        <?= $this->Form->submit(); ?>
        <?= $this->Form->end() ?>
    </div>
</div>
<?php if(isset($base64)) : ?> 
    <div>
        <ul>
            <?php foreach($base64 as $name => $value) : ?>
            <li><?= $name ?>: <?= $value ?></li>
            <?php endforeach ?>
        </ul>
    </div>
<?php endif; ?>