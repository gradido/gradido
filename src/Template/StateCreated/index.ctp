<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateCreated[]|\Cake\Collection\CollectionInterface $stateCreated
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New State Created'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateCreated index large-9 medium-8 columns content">
    <h3><?= __('State Created') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('month') ?></th>
                <th scope="col"><?= $this->Paginator->sort('year') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_user_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('created') ?></th>
                <th scope="col"><?= $this->Paginator->sort('short_ident_hash') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($stateCreated as $stateCreated): ?>
            <tr>
                <td><?= $this->Number->format($stateCreated->id) ?></td>
                <td><?= $stateCreated->has('transaction') ? $this->Html->link($stateCreated->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $stateCreated->transaction->id]) : '' ?></td>
                <td><?= $this->Number->format($stateCreated->month) ?></td>
                <td><?= $this->Number->format($stateCreated->year) ?></td>
                <td><?= $stateCreated->has('state_user') ? $this->Html->link($stateCreated->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $stateCreated->state_user->id]) : '' ?></td>
                <td><?= h($stateCreated->created) ?></td>
                <td><?= $this->Number->format($stateCreated->short_ident_hash) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $stateCreated->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $stateCreated->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $stateCreated->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateCreated->id)]) ?>
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
