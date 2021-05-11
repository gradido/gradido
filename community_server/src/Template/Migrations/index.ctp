<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\Migration[]|\Cake\Collection\CollectionInterface $migrations
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Migration'), ['action' => 'add']) ?></li>
    </ul>
</nav>
<div class="migrations index large-9 medium-8 columns content">
    <h3><?= __('Migrations') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('db_version') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($migrations as $migration): ?>
            <tr>
                <td><?= $this->Number->format($migration->id) ?></td>
                <td><?= $this->Number->format($migration->db_version) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $migration->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $migration->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $migration->id], ['confirm' => __('Are you sure you want to delete # {0}?', $migration->id)]) ?>
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
