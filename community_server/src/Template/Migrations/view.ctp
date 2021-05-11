<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\Migration $migration
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Migration'), ['action' => 'edit', $migration->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Migration'), ['action' => 'delete', $migration->id], ['confirm' => __('Are you sure you want to delete # {0}?', $migration->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Migrations'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Migration'), ['action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="migrations view large-9 medium-8 columns content">
    <h3><?= h($migration->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($migration->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Db Version') ?></th>
            <td><?= $this->Number->format($migration->db_version) ?></td>
        </tr>
    </table>
</div>
