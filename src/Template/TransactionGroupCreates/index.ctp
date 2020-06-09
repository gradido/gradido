<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionGroupCreate[]|\Cake\Collection\CollectionInterface $transactionGroupCreates
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Create'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionGroupCreates index large-9 medium-8 columns content">
    <h3><?= __('Transaction Group Creates') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_group_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('name') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($transactionGroupCreates as $transactionGroupCreate): ?>
            <tr>
                <td><?= $this->Number->format($transactionGroupCreate->id) ?></td>
                <td><?= $transactionGroupCreate->has('transaction') ? $this->Html->link($transactionGroupCreate->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionGroupCreate->transaction->id]) : '' ?></td>
                <td><?= $transactionGroupCreate->has('state_group') ? $this->Html->link($transactionGroupCreate->state_group->name, ['controller' => 'StateGroups', 'action' => 'view', $transactionGroupCreate->state_group->id]) : '' ?></td>
                <td><?= h($transactionGroupCreate->name) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $transactionGroupCreate->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $transactionGroupCreate->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $transactionGroupCreate->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupCreate->id)]) ?>
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
