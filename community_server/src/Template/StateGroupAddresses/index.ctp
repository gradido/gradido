<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateGroupAddress[]|\Cake\Collection\CollectionInterface $stateGroupAddresses
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New State Group Address'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Address Types'), ['controller' => 'AddressTypes', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Address Type'), ['controller' => 'AddressTypes', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateGroupAddresses index large-9 medium-8 columns content">
    <h3><?= __('State Group Addresses') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_group_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('address_type_id') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($stateGroupAddresses as $stateGroupAddress): ?>
            <tr>
                <td><?= $this->Number->format($stateGroupAddress->id) ?></td>
                <td><?= $stateGroupAddress->has('state_group') ? $this->Html->link($stateGroupAddress->state_group->name, ['controller' => 'StateGroups', 'action' => 'view', $stateGroupAddress->state_group->id]) : '' ?></td>
                <td><?= $stateGroupAddress->has('address_type') ? $this->Html->link($stateGroupAddress->address_type->name, ['controller' => 'AddressTypes', 'action' => 'view', $stateGroupAddress->address_type->id]) : '' ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $stateGroupAddress->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $stateGroupAddress->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $stateGroupAddress->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateGroupAddress->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <div>
        <ul class="nav-horizontal">
            <?= $this->Paginator->first('<< ' . __('first')) ?>
            <?= $this->Paginator->prev('< ' . __('previous')) ?>
            <?= $this->Paginator->numbers() ?>
            <?= $this->Paginator->next(__('next') . ' >') ?>
            <?= $this->Paginator->last(__('last') . ' >>') ?>
        </ul>
        <p><?= $this->Paginator->counter(['format' => __('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')]) ?></p>
    </div>
</div>
