<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateUserTransaction $stateUserTransaction
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $stateUserTransaction->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $stateUserTransaction->id)]
            )
        ?></li>
        <li><?= $this->Html->link(__('List State User Transactions'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Types'), ['controller' => 'TransactionTypes', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Type'), ['controller' => 'TransactionTypes', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateUserTransactions form large-9 medium-8 columns content">
    <?= $this->Form->create($stateUserTransaction) ?>
    <fieldset>
        <legend><?= __('Edit State User Transaction') ?></legend>
        <?php
            echo $this->Form->control('state_user_id', ['options' => $stateUsers]);
            echo $this->Form->control('transaction_id', ['options' => $transactions]);
            echo $this->Form->control('transaction_type_id', ['options' => $transactionTypes]);
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
