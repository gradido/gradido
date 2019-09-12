<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateBalance $stateBalance
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit State Balance'), ['action' => 'edit', $stateBalance->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete State Balance'), ['action' => 'delete', $stateBalance->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateBalance->id)]) ?> </li>
        <li><?= $this->Html->link(__('List State Balances'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Balance'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateBalances view large-9 medium-8 columns content">
    <h3><?= h($stateBalance->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('State User') ?></th>
            <td><?= $stateBalance->has('state_user') ? $this->Html->link($stateBalance->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $stateBalance->state_user->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($stateBalance->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Amount') ?></th>
            <td><?= $this->Number->format($stateBalance->amount) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Modified') ?></th>
            <td><?= h($stateBalance->modified) ?></td>
        </tr>
    </table>
</div>
