<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateGroupAddress $stateGroupAddress
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit State Group Address'), ['action' => 'edit', $stateGroupAddress->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete State Group Address'), ['action' => 'delete', $stateGroupAddress->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateGroupAddress->id)]) ?> </li>
        <li><?= $this->Html->link(__('List State Group Addresses'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Group Address'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Address Types'), ['controller' => 'AddressTypes', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Address Type'), ['controller' => 'AddressTypes', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateGroupAddresses view large-9 medium-8 columns content">
    <h3><?= h($stateGroupAddress->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Address Type') ?></th>
            <td><?= $stateGroupAddress->has('address_type') ? $this->Html->link($stateGroupAddress->address_type->name, ['controller' => 'AddressTypes', 'action' => 'view', $stateGroupAddress->address_type->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($stateGroupAddress->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Group Id') ?></th>
            <td><?= $this->Number->format($stateGroupAddress->group_id) ?></td>
        </tr>
    </table>
</div>
