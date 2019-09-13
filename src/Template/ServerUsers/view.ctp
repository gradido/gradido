<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\ServerUser $serverUser
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Server User'), ['action' => 'edit', $serverUser->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Server User'), ['action' => 'delete', $serverUser->id], ['confirm' => __('Are you sure you want to delete # {0}?', $serverUser->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Server Users'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Server User'), ['action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="serverUsers view large-9 medium-8 columns content">
    <h3><?= h($serverUser->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Username') ?></th>
            <td><?= h($serverUser->username) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Password') ?></th>
            <td><?= h($serverUser->password) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Email') ?></th>
            <td><?= h($serverUser->email) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Role') ?></th>
            <td><?= h($serverUser->role) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($serverUser->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Last Login') ?></th>
            <td><?= h($serverUser->last_login) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Created') ?></th>
            <td><?= h($serverUser->created) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Modified') ?></th>
            <td><?= h($serverUser->modified) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Activated') ?></th>
            <td><?= $serverUser->activated ? __('Yes') : __('No'); ?></td>
        </tr>
    </table>
</div>
