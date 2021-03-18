<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\AdminError $adminError
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Admin Error'), ['action' => 'edit', $adminError->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Admin Error'), ['action' => 'delete', $adminError->id], ['confirm' => __('Are you sure you want to delete # {0}?', $adminError->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Admin Errors'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Admin Error'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="adminErrors view large-9 medium-8 columns content">
    <h3><?= h($adminError->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('State User') ?></th>
            <td><?= $adminError->has('state_user') ? $this->Html->link($adminError->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $adminError->state_user->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Controller') ?></th>
            <td><?= h($adminError->controller) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Action') ?></th>
            <td><?= h($adminError->action) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('State') ?></th>
            <td><?= h($adminError->state) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Msg') ?></th>
            <td><?= h($adminError->msg) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Details') ?></th>
            <td><?= h($adminError->details) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($adminError->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Created') ?></th>
            <td><?= h($adminError->created) ?></td>
        </tr>
    </table>
</div>
