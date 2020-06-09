<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\AddressType $addressType
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List Address Types'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List State Group Addresses'), ['controller' => 'StateGroupAddresses', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group Address'), ['controller' => 'StateGroupAddresses', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Addaddress'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Addaddres'), ['controller' => 'TransactionGroupAddaddress', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="addressTypes form large-9 medium-8 columns content">
    <?= $this->Form->create($addressType) ?>
    <fieldset>
        <legend><?= __('Add Address Type') ?></legend>
        <?php
            echo $this->Form->control('name');
            echo $this->Form->control('text');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
