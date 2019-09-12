<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateGroup[]|\Cake\Collection\CollectionInterface $stateGroups
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New State Group'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Group Addresses'), ['controller' => 'StateGroupAddresses', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group Address'), ['controller' => 'StateGroupAddresses', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Group Creates'), ['controller' => 'TransactionGroupCreates', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Create'), ['controller' => 'TransactionGroupCreates', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateGroups index large-9 medium-8 columns content">
    <h3><?= __('State Groups') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('name') ?></th>
                <th scope="col"><?= $this->Paginator->sort('user_count') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($stateGroups as $stateGroup): ?>
            <tr>
                <td><?= $this->Number->format($stateGroup->id) ?></td>
                <td><?= h($stateGroup->name) ?></td>
                <td><?= $this->Number->format($stateGroup->user_count) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $stateGroup->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $stateGroup->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $stateGroup->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateGroup->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <div class="paginator">
        <ul class="pagination">
            <?= $this->Paginator->first('<< ' . __('first')) ?>
            <?= $this->Paginator->prev('< ' . __('previous')) ?>
            <?= $this->Paginator->numbers() ?>
            <?= $this->Paginator->next(__('next') . ' >') ?>
            <?= $this->Paginator->last(__('last') . ' >>') ?>
        </ul>
        <p><?= $this->Paginator->counter(['format' => __('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')]) ?></p>
    </div>
</div>
