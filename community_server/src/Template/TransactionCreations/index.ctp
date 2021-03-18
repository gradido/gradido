<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionCreation[]|\Cake\Collection\CollectionInterface $transactionCreations
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Transaction Creation'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionCreations index large-9 medium-8 columns content">
    <h3><?= __('Transaction Creations') ?></h3>
    <table cellpadding="0" cellspacing="0" style="table-layout: auto;">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_user_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('amount') ?></th>
                <th scope="col"><?= $this->Paginator->sort('ident_hash ') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($transactionCreations as $transactionCreation): ?>
            <tr>
                <td><?= $this->Number->format($transactionCreation->id) ?></td>
                <td><?= $transactionCreation->has('transaction') ? $this->Html->link($transactionCreation->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionCreation->transaction->id]) : '' ?></td>
                <td><?= $transactionCreation->has('state_user') ? $this->Html->link($transactionCreation->state_user->getEmailWithName(), ['controller' => 'StateUsers', 'action' => 'view', $transactionCreation->state_user->id]) : '' ?></td>
                <td><?= $this->element('printGradido', ['number' => $transactionCreation->amount]) ?></td>
                <td><?= stream_get_contents($transactionCreation->ident_hash) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $transactionCreation->id]) ?>
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
