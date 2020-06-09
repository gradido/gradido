<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionGroupAddaddres[]|\Cake\Collection\CollectionInterface $transactionGroupAddaddress
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Transaction Group Addaddres'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Address Types'), ['controller' => 'AddressTypes', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Address Type'), ['controller' => 'AddressTypes', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionGroupAddaddress index large-9 medium-8 columns content">
    <h3><?= __('Transaction Group Addaddress') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('address_type_id') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($transactionGroupAddaddress as $transactionGroupAddaddres): ?>
            <tr>
                <td><?= $this->Number->format($transactionGroupAddaddres->id) ?></td>
                <td><?= $transactionGroupAddaddres->has('transaction') ? $this->Html->link($transactionGroupAddaddres->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionGroupAddaddres->transaction->id]) : '' ?></td>
                <td><?= $transactionGroupAddaddres->has('address_type') ? $this->Html->link($transactionGroupAddaddres->address_type->name, ['controller' => 'AddressTypes', 'action' => 'view', $transactionGroupAddaddres->address_type->id]) : '' ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $transactionGroupAddaddres->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $transactionGroupAddaddres->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $transactionGroupAddaddres->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupAddaddres->id)]) ?>
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
