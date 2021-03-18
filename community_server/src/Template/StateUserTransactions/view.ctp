<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateUserTransaction $stateUserTransaction
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit State User Transaction'), ['action' => 'edit', $stateUserTransaction->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete State User Transaction'), ['action' => 'delete', $stateUserTransaction->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateUserTransaction->id)]) ?> </li>
        <li><?= $this->Html->link(__('List State User Transactions'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User Transaction'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Types'), ['controller' => 'TransactionTypes', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Type'), ['controller' => 'TransactionTypes', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateUserTransactions view large-9 medium-8 columns content">
    <h3><?= h($stateUserTransaction->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('State User') ?></th>
            <td><?= $stateUserTransaction->has('state_user') ? $this->Html->link($stateUserTransaction->state_user->email, ['controller' => 'StateUsers', 'action' => 'view', $stateUserTransaction->state_user->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Transaction') ?></th>
            <td><?= $stateUserTransaction->has('transaction') ? $this->Html->link($stateUserTransaction->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $stateUserTransaction->transaction->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Transaction Type') ?></th>
            <td><?= $stateUserTransaction->has('transaction_type') ? $this->Html->link($stateUserTransaction->transaction_type->name, ['controller' => 'TransactionTypes', 'action' => 'view', $stateUserTransaction->transaction_type->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($stateUserTransaction->id) ?></td>
        </tr>
    </table>
</div>
