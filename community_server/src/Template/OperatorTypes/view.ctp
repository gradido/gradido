<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\OperatorType $operatorType
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit Operator Type'), ['action' => 'edit', $operatorType->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete Operator Type'), ['action' => 'delete', $operatorType->id], ['confirm' => __('Are you sure you want to delete # {0}?', $operatorType->id)]) ?> </li>
        <li><?= $this->Html->link(__('List Operator Types'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Operator Type'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Operators'), ['controller' => 'Operators', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Operator'), ['controller' => 'Operators', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="operatorTypes view large-9 medium-8 columns content">
    <h3><?= h($operatorType->name) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Name') ?></th>
            <td><?= h($operatorType->name) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Text') ?></th>
            <td><?= h($operatorType->text) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($operatorType->id) ?></td>
        </tr>
    </table>
    <div class="related">
        <h4><?= __('Related Operators') ?></h4>
        <?php if (!empty($operatorType->operators)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Username') ?></th>
                <th scope="col"><?= __('Operator Type Id') ?></th>
                <th scope="col"><?= __('Data Base64') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($operatorType->operators as $operators): ?>
            <tr>
                <td><?= h($operators->id) ?></td>
                <td><?= h($operators->username) ?></td>
                <td><?= h($operators->operator_type_id) ?></td>
                <td><?= h($operators->data_base64) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'Operators', 'action' => 'view', $operators->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'Operators', 'action' => 'edit', $operators->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'Operators', 'action' => 'delete', $operators->id], ['confirm' => __('Are you sure you want to delete # {0}?', $operators->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
</div>
