<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionGroupAllowtrade $transactionGroupAllowtrade
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Allowtrades'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionGroupAllowtrades form large-9 medium-8 columns content">
    <?= $this->Form->create($transactionGroupAllowtrade) ?>
    <fieldset>
        <legend><?= __('Add Transaction Group Allowtrade') ?></legend>
        <?php
            echo $this->Form->control('transaction_id', ['options' => $transactions]);
            echo $this->Form->control('group_id');
            echo $this->Form->control('allow');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
