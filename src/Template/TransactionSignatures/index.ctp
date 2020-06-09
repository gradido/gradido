<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\TransactionSignature[]|\Cake\Collection\CollectionInterface $transactionSignatures
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Transaction Signature'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="transactionSignatures index large-9 medium-8 columns content">
    <h3><?= __('Transaction Signatures') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_id') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($transactionSignatures as $transactionSignature): ?>
            <tr>
                <td><?= $this->Number->format($transactionSignature->id) ?></td>
                <td><?= $transactionSignature->has('transaction') ? $this->Html->link($transactionSignature->transaction->id, ['controller' => 'Transactions', 'action' => 'view', $transactionSignature->transaction->id]) : '' ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $transactionSignature->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $transactionSignature->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $transactionSignature->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionSignature->id)]) ?>
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
