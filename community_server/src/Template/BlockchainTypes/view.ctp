<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\BlockchainType $blockchainType
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Blockchain Type'), ['action' => 'edit', $blockchainType->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Blockchain Type'), ['action' => 'delete', $blockchainType->id], ['confirm' => __('Are you sure you want to delete # {0}?', $blockchainType->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Blockchain Types'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Blockchain Type'), ['action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="blockchainTypes view large-9 medium-8 columns content">
    <h3><?= h($blockchainType->name) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Name') ?></th>
            <td><?= h($blockchainType->name) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Text') ?></th>
            <td><?= h($blockchainType->text) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Symbol') ?></th>
            <td><?= h($blockchainType->symbol) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($blockchainType->id) ?></td>
        </tr>
    </table>
</div>
