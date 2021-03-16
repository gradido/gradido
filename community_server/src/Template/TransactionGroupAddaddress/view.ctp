<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionGroupAddaddres $transactionGroupAddaddres
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Transaction Group Addaddres'), ['action' => 'edit', $transactionGroupAddaddres->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Transaction Group Addaddres'), ['action' => 'delete', $transactionGroupAddaddres->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupAddaddres->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Group Addaddress'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Group Addaddres'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Address Types'), ['controller' => 'AddressTypes', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Address Type'), ['controller' => 'AddressTypes', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="transactionGroupAddaddress view large-9 medium-8 columns content">
    <h3><?= h($transactionGroupAddaddres->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Transaction') ?></th>
            <td><?= $transactionGroupAddaddres->has('transaction') ? $this->Html->link($transactionGroupAddaddres->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionGroupAddaddres->transaction->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Address Type') ?></th>
            <td><?= $transactionGroupAddaddres->has('address_type') ? $this->Html->link($transactionGroupAddaddres->address_type->name, ['controller' => 'AddressTypes', 'action' => 'view', $transactionGroupAddaddres->address_type->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($transactionGroupAddaddres->id) ?></td>
        </tr>
    </table>
</div>
