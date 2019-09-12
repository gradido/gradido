<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * Transaction Entity
 *
 * @property int $id
 * @property int $state_group_id
 * @property int $transaction_type_id
 * @property string|resource $tx_hash
 * @property \Cake\I18n\FrozenTime $received
 *
 * @property \App\Model\Entity\StateGroup $state_group
 * @property \App\Model\Entity\TransactionType $transaction_type
 * @property \App\Model\Entity\StateCreated[] $state_created
 * @property \App\Model\Entity\TransactionCreation[] $transaction_creations
 * @property \App\Model\Entity\TransactionGroupAddaddres[] $transaction_group_addaddress
 * @property \App\Model\Entity\TransactionGroupAllowtrade[] $transaction_group_allowtrades
 * @property \App\Model\Entity\TransactionGroupCreate[] $transaction_group_creates
 * @property \App\Model\Entity\TransactionSendCoin[] $transaction_send_coins
 * @property \App\Model\Entity\TransactionSignature[] $transaction_signatures
 */
class Transaction extends Entity
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
        'state_group_id' => true,
        'transaction_type_id' => true,
        'tx_hash' => true,
        'received' => true,
        'state_group' => true,
        'transaction_type' => true,
        'state_created' => true,
        'transaction_creations' => true,
        'transaction_group_addaddress' => true,
        'transaction_group_allowtrades' => true,
        'transaction_group_creates' => true,
        'transaction_send_coins' => true,
        'transaction_signatures' => true
    ];
}
