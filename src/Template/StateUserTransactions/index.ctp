<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateUserTransaction[]|\Cake\Collection\CollectionInterface $stateUserTransactions
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New State User Transaction'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Types'), ['controller' => 'TransactionTypes', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Type'), ['controller' => 'TransactionTypes', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateUserTransactions index large-9 medium-8 columns content">
    <h3><?= __('State User Transactions') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_user_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_type_id') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($stateUserTransactions as $stateUserTransaction): ?>
            <tr>
                <td><?= $this->Number->format($stateUserTransaction->id) ?></td>
                <td><?= $stateUserTransaction->has('state_user') ? $this->Html->link($stateUserTransaction->state_user->email, ['controller' => 'StateUsers', 'action' => 'view', $stateUserTransaction->state_user->id]) : '' ?></td>
                <td><?= $stateUserTransaction->has('transaction') ? $this->Html->link($stateUserTransaction->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $stateUserTransaction->transaction->id]) : '' ?></td>
                <td><?= $stateUserTransaction->has('transaction_type') ? $this->Html->link($stateUserTransaction->transaction_type->name, ['controller' => 'TransactionTypes', 'action' => 'view', $stateUserTransaction->transaction_type->id]) : '' ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $stateUserTransaction->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $stateUserTransaction->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $stateUserTransaction->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateUserTransaction->id)]) ?>
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
