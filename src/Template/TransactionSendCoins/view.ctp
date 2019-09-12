<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionSendCoin $transactionSendCoin
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Transaction Send Coin'), ['action' => 'edit', $transactionSendCoin->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Transaction Send Coin'), ['action' => 'delete', $transactionSendCoin->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionSendCoin->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Send Coins'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Send Coin'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="transactionSendCoins view large-9 medium-8 columns content">
    <h3><?= h($transactionSendCoin->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Transaction') ?></th>
            <td><?= $transactionSendCoin->has('transaction') ? $this->Html->link($transactionSendCoin->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionSendCoin->transaction->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('State User') ?></th>
            <td><?= $transactionSendCoin->has('state_user') ? $this->Html->link($transactionSendCoin->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $transactionSendCoin->state_user->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($transactionSendCoin->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Amount') ?></th>
            <td><?= $this->Number->format($transactionSendCoin->amount) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Sender Final Balance') ?></th>
            <td><?= $this->Number->format($transactionSendCoin->sender_final_balance) ?></td>
        </tr>
    </table>
</div>
