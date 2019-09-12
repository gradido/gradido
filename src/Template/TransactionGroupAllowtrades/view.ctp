<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionGroupAllowtrade $transactionGroupAllowtrade
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Transaction Group Allowtrade'), ['action' => 'edit', $transactionGroupAllowtrade->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Transaction Group Allowtrade'), ['action' => 'delete', $transactionGroupAllowtrade->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupAllowtrade->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Group Allowtrades'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Group Allowtrade'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="transactionGroupAllowtrades view large-9 medium-8 columns content">
    <h3><?= h($transactionGroupAllowtrade->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Transaction') ?></th>
            <td><?= $transactionGroupAllowtrade->has('transaction') ? $this->Html->link($transactionGroupAllowtrade->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionGroupAllowtrade->transaction->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($transactionGroupAllowtrade->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Group Id') ?></th>
            <td><?= $this->Number->format($transactionGroupAllowtrade->group_id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Allow') ?></th>
            <td><?= $transactionGroupAllowtrade->allow ? __('Yes') : __('No'); ?></td>
        </tr>
    </table>
</div>
