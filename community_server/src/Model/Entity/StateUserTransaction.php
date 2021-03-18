<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * StateUserTransaction Entity
 *
 * @property int $id
 * @property int $state_user_id
 * @property int $transaction_id
 * @property int $transaction_type_id
 *
 * @property \App\Model\Entity\StateUser $state_user
 * @property \App\Model\Entity\Transaction $transaction
 * @property \App\Model\Entity\TransactionType $transaction_type
 */
class StateUserTransaction extends Entity
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
        'state_user_id' => true,
        'transaction_id' => true,
        'transaction_type_id' => true,
        'state_user' => true,
        'transaction' => true,
        'transaction_type' => true,
    ];
}
