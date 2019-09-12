<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateCreated $stateCreated
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit State Created'), ['action' => 'edit', $stateCreated->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete State Created'), ['action' => 'delete', $stateCreated->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateCreated->id)]) ?> </li>
        <li><?= $this->Html->link(__('List State Created'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Created'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateCreated view large-9 medium-8 columns content">
    <h3><?= h($stateCreated->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Transaction') ?></th>
            <td><?= $stateCreated->has('transaction') ? $this->Html->link($stateCreated->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $stateCreated->transaction->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('State User') ?></th>
            <td><?= $stateCreated->has('state_user') ? $this->Html->link($stateCreated->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $stateCreated->state_user->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($stateCreated->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Month') ?></th>
            <td><?= $this->Number->format($stateCreated->month) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Year') ?></th>
            <td><?= $this->Number->format($stateCreated->year) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Short Ident Hash') ?></th>
            <td><?= $this->Number->format($stateCreated->short_ident_hash) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Created') ?></th>
            <td><?= h($stateCreated->created) ?></td>
        </tr>
    </table>
</div>
