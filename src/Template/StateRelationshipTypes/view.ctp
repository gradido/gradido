<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateRelationshipType $stateRelationshipType
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit State Relationship Type'), ['action' => 'edit', $stateRelationshipType->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete State Relationship Type'), ['action' => 'delete', $stateRelationshipType->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateRelationshipType->id)]) ?> </li>
        <li><?= $this->Html->link(__('List State Relationship Types'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Relationship Type'), ['action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateRelationshipTypes view large-9 medium-8 columns content">
    <h3><?= h($stateRelationshipType->name) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Name') ?></th>
            <td><?= h($stateRelationshipType->name) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Text') ?></th>
            <td><?= h($stateRelationshipType->text) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($stateRelationshipType->id) ?></td>
        </tr>
    </table>
</div>
