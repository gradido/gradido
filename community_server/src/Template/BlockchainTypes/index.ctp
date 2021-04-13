<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\BlockchainType[]|\Cake\Collection\CollectionInterface $blockchainTypes
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Blockchain Type'), ['action' => 'add']) ?></li>
    </ul>
</nav>
<div class="blockchainTypes index large-9 medium-8 columns content">
    <h3><?= __('Blockchain Types') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('name') ?></th>
                <th scope="col"><?= $this->Paginator->sort('text') ?></th>
                <th scope="col"><?= $this->Paginator->sort('symbol') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($blockchainTypes as $blockchainType): ?>
            <tr>
                <td><?= $this->Number->format($blockchainType->id) ?></td>
                <td><?= h($blockchainType->name) ?></td>
                <td><?= h($blockchainType->text) ?></td>
                <td><?= h($blockchainType->symbol) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $blockchainType->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $blockchainType->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $blockchainType->id], ['confirm' => __('Are you sure you want to delete # {0}?', $blockchainType->id)]) ?>
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
