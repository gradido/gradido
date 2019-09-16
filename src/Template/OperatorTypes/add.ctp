<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\OperatorType $operatorType
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('List Operator Types'), ['action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('List Operators'), ['controller' => 'Operators', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Operator'), ['controller' => 'Operators', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="operatorTypes form large-9 medium-8 columns content">
    <?= $this->Form->create($operatorType) ?>
    <fieldset>
        <legend><?= __('Add Operator Type') ?></legend>
        <?php
            echo $this->Form->control('name');
            echo $this->Form->control('text');
        ?>
    </fieldset>
    <?= $this->Form->button(__('Submit')) ?>
    <?= $this->Form->end() ?>
</div>
