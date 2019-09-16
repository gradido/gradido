<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\OperatorType[]|\Cake\Collection\CollectionInterface $operatorTypes
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Operator Type'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Operators'), ['controller' => 'Operators', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Operator'), ['controller' => 'Operators', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="operatorTypes index large-9 medium-8 columns content">
    <h3><?= __('Operator Types') ?></h3>
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
            <?php foreach ($operatorTypes as $operatorType): ?>
            <tr>
                <td><?= $this->Number->format($operatorType->id) ?></td>
                <td><?= h($operatorType->name) ?></td>
                <td><?= h($operatorType->text) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $operatorType->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $operatorType->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $operatorType->id], ['confirm' => __('Are you sure you want to delete # {0}?', $operatorType->id)]) ?>
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
