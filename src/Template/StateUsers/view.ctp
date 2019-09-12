<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateUser $stateUser
 */
?>
<nav class="large-3 medium-4 columns" id="actions-sidebar">
    <ul class="side-nav">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('Edit State User'), ['action' => 'edit', $stateUser->id]) ?> </li>
        <li><?= $this->Form->postLink(__('Delete State User'), ['action' => 'delete', $stateUser->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateUser->id)]) ?> </li>
        <li><?= $this->Html->link(__('List State Users'), ['action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State User'), ['action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Groups'), ['controller' => 'StateGroups', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Group'), ['controller' => 'StateGroups', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Balances'), ['controller' => 'StateBalances', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Balance'), ['controller' => 'StateBalances', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List State Created'), ['controller' => 'StateCreated', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New State Created'), ['controller' => 'StateCreated', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Creations'), ['controller' => 'TransactionCreations', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Creation'), ['controller' => 'TransactionCreations', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Send Coins'), ['controller' => 'TransactionSendCoins', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Send Coin'), ['controller' => 'TransactionSendCoins', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateUsers view large-9 medium-8 columns content">
    <h3><?= h($stateUser->id) ?></h3>
    <table class="vertical-table">
        <tr>
            <th scope="row"><?= __('State Group') ?></th>
            <td><?= $stateUser->has('state_group') ? $this->Html->link($stateUser->state_group->name, ['controller' => 'StateGroups', 'action' => 'view', $stateUser->state_group->id]) : '' ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Id') ?></th>
            <td><?= $this->Number->format($stateUser->id) ?></td>
        </tr>
        <tr>
            <th scope="row"><?= __('Index Id') ?></th>
            <td><?= $this->Number->format($stateUser->index_id) ?></td>
        </tr>
    </table>
    <div class="related">
        <h4><?= __('Related State Balances') ?></h4>
        <?php if (!empty($stateUser->state_balances)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('State User Id') ?></th>
                <th scope="col"><?= __('Modified') ?></th>
                <th scope="col"><?= __('Amount') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateUser->state_balances as $stateBalances): ?>
            <tr>
                <td><?= h($stateBalances->id) ?></td>
                <td><?= h($stateBalances->state_user_id) ?></td>
                <td><?= h($stateBalances->modified) ?></td>
                <td><?= h($stateBalances->amount) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'StateBalances', 'action' => 'view', $stateBalances->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'StateBalances', 'action' => 'edit', $stateBalances->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'StateBalances', 'action' => 'delete', $stateBalances->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateBalances->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related State Created') ?></h4>
        <?php if (!empty($stateUser->state_created)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('Month') ?></th>
                <th scope="col"><?= __('Year') ?></th>
                <th scope="col"><?= __('State User Id') ?></th>
                <th scope="col"><?= __('Created') ?></th>
                <th scope="col"><?= __('Short Ident Hash') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateUser->state_created as $stateCreated): ?>
            <tr>
                <td><?= h($stateCreated->id) ?></td>
                <td><?= h($stateCreated->transaction_id) ?></td>
                <td><?= h($stateCreated->month) ?></td>
                <td><?= h($stateCreated->year) ?></td>
                <td><?= h($stateCreated->state_user_id) ?></td>
                <td><?= h($stateCreated->created) ?></td>
                <td><?= h($stateCreated->short_ident_hash) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'StateCreated', 'action' => 'view', $stateCreated->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'StateCreated', 'action' => 'edit', $stateCreated->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'StateCreated', 'action' => 'delete', $stateCreated->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateCreated->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transaction Creations') ?></h4>
        <?php if (!empty($stateUser->transaction_creations)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('State User Id') ?></th>
                <th scope="col"><?= __('Amount') ?></th>
                <th scope="col"><?= __('Ident Hash') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateUser->transaction_creations as $transactionCreations): ?>
            <tr>
                <td><?= h($transactionCreations->id) ?></td>
                <td><?= h($transactionCreations->transaction_id) ?></td>
                <td><?= h($transactionCreations->state_user_id) ?></td>
                <td><?= h($transactionCreations->amount) ?></td>
                <td><?= h($transactionCreations->ident_hash) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionCreations', 'action' => 'view', $transactionCreations->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionCreations', 'action' => 'edit', $transactionCreations->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionCreations', 'action' => 'delete', $transactionCreations->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionCreations->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
    <div class="related">
        <h4><?= __('Related Transaction Send Coins') ?></h4>
        <?php if (!empty($stateUser->transaction_send_coins)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Id') ?></th>
                <th scope="col"><?= __('Transaction Id') ?></th>
                <th scope="col"><?= __('State User Id') ?></th>
                <th scope="col"><?= __('Receiver Public Key') ?></th>
                <th scope="col"><?= __('Receiver User Id') ?></th>
                <th scope="col"><?= __('Amount') ?></th>
                <th scope="col"><?= __('Sender Final Balance') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateUser->transaction_send_coins as $transactionSendCoins): ?>
            <tr>
                <td><?= h($transactionSendCoins->id) ?></td>
                <td><?= h($transactionSendCoins->transaction_id) ?></td>
                <td><?= h($transactionSendCoins->state_user_id) ?></td>
                <td><?= h($transactionSendCoins->receiver_public_key) ?></td>
                <td><?= h($transactionSendCoins->receiver_user_id) ?></td>
                <td><?= h($transactionSendCoins->amount) ?></td>
                <td><?= h($transactionSendCoins->sender_final_balance) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionSendCoins', 'action' => 'view', $transactionSendCoins->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionSendCoins', 'action' => 'edit', $transactionSendCoins->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionSendCoins', 'action' => 'delete', $transactionSendCoins->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionSendCoins->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
</div>
