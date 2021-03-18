<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionCreation $transactionCreation
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List Transaction Creations'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionCreations form large-9 medium-8 columns content">
    <?= $this->Form->create($transactionCreation) ?>
    <fieldset>
        <legend><?= __('Add Transaction Creation') ?></legend>
        <?php
            echo $this->Form->control('transaction_id', ['options' => $transactions]);
            echo $this->Form->control('state_user_id', ['options' => $stateUsers]);
            echo $this->Form->control('amount');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
