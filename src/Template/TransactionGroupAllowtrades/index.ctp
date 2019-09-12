<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionGroupAllowtrade[]|\Cake\Collection\CollectionInterface $transactionGroupAllowtrades
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Allowtrade'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionGroupAllowtrades index large-9 medium-8 columns content">
    <h3><?= __('Transaction Group Allowtrades') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('group_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('allow') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($transactionGroupAllowtrades as $transactionGroupAllowtrade): ?>
            <tr>
                <td><?= $this->Number->format($transactionGroupAllowtrade->id) ?></td>
                <td><?= $transactionGroupAllowtrade->has('transaction') ? $this->Html->link($transactionGroupAllowtrade->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionGroupAllowtrade->transaction->id]) : '' ?></td>
                <td><?= $this->Number->format($transactionGroupAllowtrade->group_id) ?></td>
                <td><?= h($transactionGroupAllowtrade->allow) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $transactionGroupAllowtrade->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $transactionGroupAllowtrade->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $transactionGroupAllowtrade->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupAllowtrade->id)]) ?>
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
