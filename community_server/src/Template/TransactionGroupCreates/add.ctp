<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionGroupCreate $transactionGroupCreate
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Creates'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionGroupCreates form large-9 medium-8 columns content">
    <?= $this->Form->create($transactionGroupCreate) ?>
    <fieldset>
        <legend><?= __('Add Transaction Group Create') ?></legend>
        <?php
            echo $this->Form->control('transaction_id', ['options' => $transactions]);
            echo $this->Form->control('state_group_id', ['options' => $stateGroups]);
            echo $this->Form->control('name');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
