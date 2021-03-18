<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * TransactionSendCoin Entity
 *
 * @property int $id
 * @property int $transaction_id
 * @property int $state_user_id
 * @property string|resource $receiver_public_key
 * @property string|resource $receiver_user_id
 * @property int $amount
 * @property int $sender_final_balance
 *
 * @property \App\Model\Entity\Transaction $transaction
 * @property \App\Model\Entity\StateUser $state_user
 * @property \App\Model\Entity\ReceiverUser $receiver_user
 */
class TransactionSendCoin extends Entity
{
    /**
     * Fields that can be mass assigned using newEntity() or patchEntity().
     *
     * Note that when '*' is set to true, this allows all unspecified fields to
     * be mass assigned. For security purposes, it is advised to set '*' to false
     * (or remove it), and explicitly make individual fields accessible as needed.
     *
     * @var array
     */
    protected $_accessible = [
        'transaction_id' => true,
        'state_user_id' => true,
        'receiver_public_key' => true,
        'receiver_user_id' => true,
        'amount' => true,
        'sender_final_balance' => true,
        'transaction' => true,
        'state_user' => true,
        'receiver_user' => true
    ];
}
