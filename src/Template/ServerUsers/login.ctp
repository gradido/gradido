<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$this->loadHelper('Form', [
    'templates' => 'horizontal_form',
]);
?>
<?= $this->Flash->render() ?>
<div class="center-form">
    <?= $this->Form->create() ?>
    <fieldset>
    <legend><?= __('Please enter your username and password') ?></legend>
    <?= $this->Form->control('username') ?>
    <?= $this->Form->control('password') ?>
    </fieldset>
    <?= $this->Form->button(__('Login'), ['class' => 'form-button']); ?>
    <?= $this->Form->end() ?>
</div>
