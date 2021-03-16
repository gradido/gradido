<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionCreation $transactionCreation
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Transaction Creation'), ['action' => 'edit', $transactionCreation->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Transaction Creation'), ['action' => 'delete', $transactionCreation->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionCreation->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Creations'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Creation'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="transactionCreations view large-9 medium-8 columns content">
    <h3><?= h($transactionCreation->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Transaction') ?></th>
            <td><?= $transactionCreation->has('transaction') ? $this->Html->link($transactionCreation->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionCreation->transaction->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('State User') ?></th>
            <td><?= $transactionCreation->has('state_user') ? $this->Html->link($transactionCreation->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $transactionCreation->state_user->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($transactionCreation->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Amount') ?></th>
            <td><?= $this->Number->format($transactionCreation->amount) ?></td>
        </tr>
    </table>
</div>
