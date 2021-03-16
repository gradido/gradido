<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionType $transactionType
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List Transaction Types'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionTypes form large-9 medium-8 columns content">
    <?= $this->Form->create($transactionType) ?>
    <fieldset>
        <legend><?= __('Add Transaction Type') ?></legend>
        <?php
            echo $this->Form->control('name');
            echo $this->Form->control('text');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
