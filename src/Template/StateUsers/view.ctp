<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateUser $stateUser
 */
?>
<nav class="large-2 medium-3 columns" id="actions-sidebar">
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
        <li><?= $this->Html->link(__('List Transaction Creations'), ['controller' => 'TransactionCreations', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Creation'), ['controller' => 'TransactionCreations', 'action' => 'add']) ?> </li>
        <li><?= $this->Html->link(__('List Transaction Send Coins'), ['controller' => 'TransactionSendCoins', 'action' => 'index']) ?> </li>
        <li><?= $this->Html->link(__('New Transaction Send Coin'), ['controller' => 'TransactionSendCoins', 'action' => 'add']) ?> </li>
    </ul>
</nav>
<div class="stateUsers view large-10 medium-9 columns content">
  <h3><?= h($stateUser->first_name) ?> <?= h($stateUser->last_name) ?> &lt;<?= h($stateUser->email) ?>&gt;</h3>
    <div class="related">
        <h4><?= __('Related State Balances') ?></h4>
        <?php if (!empty($stateUser->state_balances)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Letztes Update') ?></th>
                <th scope="col"><?= __('Amount') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateUser->state_balances as $stateBalances): ?>
            <tr>
                <td><?= h($stateBalances->modified) ?></td>
                <td><?= $this->element('printGradido', ['number' =>$stateBalances->amount]) ?></td>
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
        <h4><?= __('Related Transaction Creations') ?></h4>
        <?php if (!empty($stateUser->transaction_creations)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Transaction') ?></th>
                <th scope="col"><?= __('Erhalten') ?></th>
                <th scope="col"><?= __('Betrag') ?></th>
                <th scope="col"><?= __('Verwendungszweck') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateUser->transaction_creations as $transactionCreations): //var_dump($transactionCreations); 
              $txHash = bin2hex(stream_get_contents($transactionCreations->transaction->tx_hash));
              $memo = $transactionCreations->transaction->memo;
              ?>
            <tr>
                <td><?= $this->Html->link(substr($txHash, 0, 12) . '...', ['controller' => 'Transactions', 'action' => 'view', $transactionCreations->transaction_id], ['title' => $txHash] ) ?></td>
                <td><?= h($transactionCreations->transaction->received) ?></td>
                <td><?= $this->element('printGradido', ['number' =>$transactionCreations->amount]) ?></td>
                <td title="<?= $memo ?>"><?= h(substr($memo, 0, 20). '...') ?></td>
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
        <h4><?= __('Versendete Überweisungen') ?></h4>
        <?php if (!empty($stateUser->transaction_send_coins)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Überweisung') ?></th>
                <th scope="col"><?= __('Erhalten') ?></th>
                <th scope="col"><?= __('Empfänger ') ?></th>
                <th scope="col"><?= __('Betrag') ?></th>
                <th scope="col"><?= __('Verwendungszweck') ?></th>
                <th scope="col"><?= __('Betrag nach Senden') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateUser->transaction_send_coins as $transactionReceiveCoins):
              $txHash = bin2hex(stream_get_contents($transactionReceiveCoins->transaction->tx_hash));
              $memo = $transactionReceiveCoins->transaction->memo;
              //var_dump($transactionSendCoins);
              ?>
            <tr>
                <td title="<?= $txHash ?>"><?= $this->Html->link(substr($txHash, 0, 12) . '...', ['controller' => 'Transactions', 'action' => 'view', $transactionReceiveCoins->transaction_id]) ?></td>
                <td><?= h($transactionReceiveCoins->transaction->received) ?></td>
                <td><?= $this->Html->link($transactionReceiveCoins->receiver_user->getEmailWithName(), ['controller' => 'StateUsers', 'action' => 'view', $transactionReceiveCoins->receiver_user_id]) ?></td>
                <td><?= $this->element('printGradido', ['number' =>$transactionReceiveCoins->amount]) ?></td>
                <td title="<?= $memo ?>"><?= h(substr($memo, 0, 20). '...') ?></td>
                <td><?= $this->element('printGradido', ['number' => $transactionReceiveCoins->sender_final_balance]) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionSendCoins', 'action' => 'view', $transactionReceiveCoins->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionSendCoins', 'action' => 'edit', $transactionReceiveCoins->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionSendCoins', 'action' => 'delete', $transactionReceiveCoins->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionReceiveCoins->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
  <!-- TransactionReceivedCoins -->
    <div class="related">
        <h4><?= __('Empfangende Überweisungen') ?></h4>
        <?php if (!empty($stateUser->transaction_received_coins)): ?>
        <table cellpadding="0" cellspacing="0">
            <tr>
                <th scope="col"><?= __('Überweisung') ?></th>
                <th scope="col"><?= __('Erhalten') ?></th>
                <th scope="col"><?= __('Sender') ?></th>
                <th scope="col"><?= __('Betrag') ?></th>
                <th scope="col"><?= __('Verwendungszweck') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
            <?php foreach ($stateUser->transaction_received_coins as $transactionReceiveCoins):
              $txHash = bin2hex(stream_get_contents($transactionReceiveCoins->transaction->tx_hash));
              $memo = $transactionReceiveCoins->transaction->memo; 
              //var_dump($transactionReceiveCoins);
              ?>
            <tr>
                <td title="<?= $txHash ?>"><?= $this->Html->link(substr($txHash, 0, 12).'...', ['controller' => 'Transactions', 'action' => 'view', $transactionReceiveCoins->transaction_id]) ?></td>
                <td><?= h($transactionReceiveCoins->transaction->received) ?></td>
                <td><?= $this->Html->link($transactionReceiveCoins->state_user->getEmailWithName(), ['controller' => 'StateUsers', 'action' => 'view', $transactionReceiveCoins->state_user_id]) ?></td>
                <td><?= $this->element('printGradido', ['number' =>$transactionReceiveCoins->amount]) ?></td>
                <td title="<?= $memo ?>"><?= h(substr($memo, 0, 20). '...') ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['controller' => 'TransactionSendCoins', 'action' => 'view', $transactionReceiveCoins->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['controller' => 'TransactionSendCoins', 'action' => 'edit', $transactionReceiveCoins->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['controller' => 'TransactionSendCoins', 'action' => 'delete', $transactionReceiveCoins->id], ['confirm' => __('Are you sure you want to delete # {0}?', $transactionReceiveCoins->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
        <?php endif; ?>
    </div>
</div>
