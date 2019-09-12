<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * TransactionCreation Entity
 *
 * @property int $id
 * @property int $transaction_id
 * @property int $state_user_id
 * @property int $amount
 * @property string|resource $ident_hash
 *
 * @property \App\Model\Entity\Transaction $transaction
 * @property \App\Model\Entity\StateUser $state_user
 */
class TransactionCreation extends Entity
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
        'amount' => true,
        'ident_hash' => true,
        'transaction' => true,
        'state_user' => true
    ];
}
