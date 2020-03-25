<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionSendCoin[]|\Cake\Collection\CollectionInterface $transactionSendCoins
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Transaction Send Coin'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionSendCoins index large-9 medium-8 columns content">
    <h3><?= __('Transaction Send Coins') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_user_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('amount') ?></th>
                <th scope="col"><?= $this->Paginator->sort('sender_final_balance') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($transactionReceiveCoins as $transactionSendCoin): ?>
            <tr>
                <td><?= $this->Number->format($transactionSendCoin->id) ?></td>
                <td><?= $transactionSendCoin->has('transaction') ? $this->Html->link($transactionSendCoin->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionSendCoin->transaction->id]) : '' ?></td>
                <td><?= $transactionSendCoin->has('state_user') ? $this->Html->link($transactionSendCoin->state_user->getEmailWithName(), ['controller' => 'StateUsers', 'action' => 'view', $transactionSendCoin->state_user->id]) : '' ?></td>
                <td><?= $this->Number->format($transactionSendCoin->amount) ?></td>
                <td><?= $this->Number->format($transactionSendCoin->sender_final_balance) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $transactionSendCoin->id]) ?>
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
