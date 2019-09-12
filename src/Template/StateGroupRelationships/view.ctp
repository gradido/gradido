<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateGroupRelationship $stateGroupRelationship
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit State Group Relationship'), ['action' => 'edit', $stateGroupRelationship->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete State Group Relationship'), ['action' => 'delete', $stateGroupRelationship->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateGroupRelationship->id)]) ?> </li>
        <li><?= $this->Html->link(__('List State Group Relationships'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Group Relationship'), ['action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateGroupRelationships view large-9 medium-8 columns content">
    <h3><?= h($stateGroupRelationship->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($stateGroupRelationship->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('State Group1 Id') ?></th>
            <td><?= $this->Number->format($stateGroupRelationship->state_group1_id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('State Group2 Id') ?></th>
            <td><?= $this->Number->format($stateGroupRelationship->state_group2_id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('State Relationship Id') ?></th>
            <td><?= $this->Number->format($stateGroupRelationship->state_relationship_id) ?></td>
        </tr>
    </table>
</div>
