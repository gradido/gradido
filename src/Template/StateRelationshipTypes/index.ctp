<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateRelationshipType[]|\Cake\Collection\CollectionInterface $stateRelationshipTypes
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New State Relationship Type'), ['action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateRelationshipTypes index large-9 medium-8 columns content">
    <h3><?= __('State Relationship Types') ?></h3>
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
            <?php foreach ($stateRelationshipTypes as $stateRelationshipType): ?>
            <tr>
                <td><?= $this->Number->format($stateRelationshipType->id) ?></td>
                <td><?= h($stateRelationshipType->name) ?></td>
                <td><?= h($stateRelationshipType->text) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $stateRelationshipType->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $stateRelationshipType->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $stateRelationshipType->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateRelationshipType->id)]) ?>
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
