<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateGroupRelationship[]|\Cake\Collection\CollectionInterface $stateGroupRelationships
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New State Group Relationship'), ['action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateGroupRelationships index large-9 medium-8 columns content">
    <h3><?= __('State Group Relationships') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_group1_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_group2_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_relationship_id') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($stateGroupRelationships as $stateGroupRelationship): ?>
            <tr>
                <td><?= $this->Number->format($stateGroupRelationship->id) ?></td>
                <td><?= $this->Number->format($stateGroupRelationship->state_group1_id) ?></td>
                <td><?= $this->Number->format($stateGroupRelationship->state_group2_id) ?></td>
                <td><?= $this->Number->format($stateGroupRelationship->state_relationship_id) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $stateGroupRelationship->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $stateGroupRelationship->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $stateGroupRelationship->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateGroupRelationship->id)]) ?>
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
