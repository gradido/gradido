<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionGroupCreate $transactionGroupCreate
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Transaction Group Create'), ['action' => 'edit', $transactionGroupCreate->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Transaction Group Create'), ['action' => 'delete', $transactionGroupCreate->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupCreate->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Group Creates'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Group Create'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="transactionGroupCreates view large-9 medium-8 columns content">
    <h3><?= h($transactionGroupCreate->name) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Transaction') ?></th>
            <td><?= $transactionGroupCreate->has('transaction') ? $this->Html->link($transactionGroupCreate->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionGroupCreate->transaction->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('State Group') ?></th>
            <td><?= $transactionGroupCreate->has('state_group') ? $this->Html->link($transactionGroupCreate->state_group->name, ['controller' => 'StateGroups', 'action' => 'view', $transactionGroupCreate->state_group->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Name') ?></th>
            <td><?= h($transactionGroupCreate->name) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($transactionGroupCreate->id) ?></td>
        </tr>
    </table>
</div>
