<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\Operator[]|\Cake\Collection\CollectionInterface $operators
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New Operator'), ['action' => 'add']) ?></li>
    </ul>
</nav>
<div class="operators index large-9 medium-8 columns content">
    <h3><?= __('Operators') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('username') ?></th>
                <th scope="col"><?= $this->Paginator->sort('user_pubkey') ?></th>
                <th scope="col"><?= $this->Paginator->sort('operator_type_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('data_base64') ?></th>
                <th scope="col"><?= $this->Paginator->sort('modified') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($operators as $operator): //var_dump($operator); 
            //echo $operator->operator_type->name ?>
            <tr>
                <td><?= $this->Number->format($operator->id) ?></td>
                <td><?= h($operator->username) ?></td>
                <td><?= h(bin2hex($operator->user_pubkey)) ?></td>
                <td><?= $this->Html->link(__($operator->operator_type->name), ['controller' => 'OperatorTypes', 'action' => 'view', $operator->operator_type_id]) ?></td>
                <td><?= h($operator->data_base64) ?></td>
                <td><?= h($operator->modified) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $operator->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $operator->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $operator->id], ['confirm' => __('Are you sure you want to delete # {0}?', $operator->id)]) ?>
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
