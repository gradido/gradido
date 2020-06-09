<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateError $stateError
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit State Error'), ['action' => 'edit', $stateError->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete State Error'), ['action' => 'delete', $stateError->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateError->id)]) ?> </li>
        <li><?= $this->Html->link(__('List State Errors'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Error'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Types'), ['controller' => 'TransactionTypes', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Type'), ['controller' => 'TransactionTypes', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateErrors view large-9 medium-8 columns content">
    <h3><?= h($stateError->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('State User') ?></th>
            <td><?= $stateError->has('state_user') ? $this->Html->link($stateError->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $stateError->state_user->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Transaction Type') ?></th>
            <td><?= $stateError->has('transaction_type') ? $this->Html->link($stateError->transaction_type->name, ['controller' => 'TransactionTypes', 'action' => 'view', $stateError->transaction_type->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($stateError->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Created') ?></th>
            <td><?= h($stateError->created) ?></td>
        </tr>
    </table>
    <div class="row">
        <h4><?= __('Message Json') ?></h4>
        <?= $this->Text->autoParagraph(h($stateError->message_json)); ?>
    </div>
</div>
