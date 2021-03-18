<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionType[]|\Cake\Collection\CollectionInterface $transactionTypes
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Transaction Type'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionTypes index large-9 medium-8 columns content">
    <h3><?= __('Transaction Types') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('name') ?></th>
                <th scope="col"><?= $this->Paginator->sort('text') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($transactionTypes as $transactionType): ?>
            <tr>
                <td><?= $this->Number->format($transactionType->id) ?></td>
                <td><?= h($transactionType->name) ?></td>
                <td><?= h($transactionType->text) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $transactionType->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $transactionType->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $transactionType->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionType->id)]) ?>
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
