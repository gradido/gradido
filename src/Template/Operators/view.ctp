<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\Operator $operator
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Operator'), ['action' => 'edit', $operator->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Operator'), ['action' => 'delete', $operator->id], ['confirm' => __('Are you sure you want to delete # {0}?', $operator->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Operators'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Operator'), ['action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="operators view large-9 medium-8 columns content">
    <h3><?= h($operator->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Username Password Hash') ?></th>
            <td><?= h($operator->usernamePasswordHash) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Data Base64') ?></th>
            <td><?= h($operator->data_base64) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($operator->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Operator Type Id') ?></th>
            <td><?= $this->Number->format($operator->operator_type_id) ?></td>
        </tr>
    </table>
</div>
