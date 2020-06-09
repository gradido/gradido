<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateGroup $stateGroup
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit State Group'), ['action' => 'edit', $stateGroup->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete State Group'), ['action' => 'delete', $stateGroup->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateGroup->id)]) ?> </li>
        <li><?= $this->Html->link(__('List State Groups'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Group'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Group Addresses'), ['controller' => 'StateGroupAddresses', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Group Address'), ['controller' => 'StateGroupAddresses', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Group Creates'), ['controller' => 'TransactionGroupCreates', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Group Create'), ['controller' => 'TransactionGroupCreates', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transactions'), ['controller' => 'Transactions', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction'), ['controller' => 'Transactions', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateGroups view large-9 medium-8 columns content">
    <h3><?= h($stateGroup->name) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('Name') ?></th>
            <td><?= h($stateGroup->name) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($stateGroup->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('User Count') ?></th>
            <td><?= $this->Number->format($stateGroup->user_count) ?></td>
        </tr>
    </table>
    <div class="related">
        <h4><?= __('Related State Group Addresses') ?></h4>
        <?php if (!empty($stateGroup->state_group_addresses)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('State Group Id') ?></th>
                <th scope="col"><?= __('Public Key') ?></th>
                <th scope="col"><?= __('Address Type Id') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateGroup->state_group_addresses as $stateGroupAddresses): ?>
            <tr>
                <td><?= h($stateGroupAddresses->id) ?></td>
                <td><?= h($stateGroupAddresses->state_group_id) ?></td>
                <td><?= h($stateGroupAddresses->public_key) ?></td>
                <td><?= h($stateGroupAddresses->address_type_id) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'StateGroupAddresses', 'action' => 'view', $stateGroupAddresses->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'StateGroupAddresses', 'action' => 'edit', $stateGroupAddresses->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'StateGroupAddresses', 'action' => 'delete', $stateGroupAddresses->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateGroupAddresses->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related State Users') ?></h4>
        <?php if (!empty($stateGroup->state_users)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Index Id') ?></th>
                <th scope="col"><?= __('State Group Id') ?></th>
                <th scope="col"><?= __('Public Key') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateGroup->state_users as $stateUsers): ?>
            <tr>
                <td><?= h($stateUsers->id) ?></td>
                <td><?= h($stateUsers->index_id) ?></td>
                <td><?= h($stateUsers->state_group_id) ?></td>
                <td><?= h($stateUsers->public_key) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'StateUsers', 'action' => 'view', $stateUsers->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'StateUsers', 'action' => 'edit', $stateUsers->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'StateUsers', 'action' => 'delete', $stateUsers->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateUsers->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transaction Group Creates') ?></h4>
        <?php if (!empty($stateGroup->transaction_group_creates)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('Group Public Key') ?></th>
                <th scope="col"><?= __('State Group Id') ?></th>
                <th scope="col"><?= __('Name') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateGroup->transaction_group_creates as $transactionGroupCreates): ?>
            <tr>
                <td><?= h($transactionGroupCreates->id) ?></td>
                <td><?= h($transactionGroupCreates->transaction_id) ?></td>
                <td><?= h($transactionGroupCreates->group_public_key) ?></td>
                <td><?= h($transactionGroupCreates->state_group_id) ?></td>
                <td><?= h($transactionGroupCreates->name) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionGroupCreates', 'action' => 'view', $transactionGroupCreates->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionGroupCreates', 'action' => 'edit', $transactionGroupCreates->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionGroupCreates', 'action' => 'delete', $transactionGroupCreates->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionGroupCreates->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transactions') ?></h4>
        <?php if (!empty($stateGroup->transactions)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('State Group Id') ?></th>
                <th scope="col"><?= __('Transaction Type Id') ?></th>
                <th scope="col"><?= __('Tx Hash') ?></th>
                <th scope="col"><?= __('Received') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateGroup->transactions as $transactions): ?>
            <tr>
                <td><?= h($transactions->id) ?></td>
                <td><?= h($transactions->state_group_id) ?></td>
                <td><?= h($transactions->transaction_type_id) ?></td>
                <td><?= h($transactions->tx_hash) ?></td>
                <td><?= h($transactions->received) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'Transactions', 'action' => 'view', $transactions->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'Transactions', 'action' => 'edit', $transactions->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'Transactions', 'action' => 'delete', $transactions->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactions->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
</div>
