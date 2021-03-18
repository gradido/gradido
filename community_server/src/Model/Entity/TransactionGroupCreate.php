<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * TransactionGroupCreate Entity
 *
 * @property int $id
 * @property int $transaction_id
 * @property string|resource $group_public_key
 * @property int $state_group_id
 * @property string $name
 *
 * @property \App\Model\Entity\Transaction $transaction
 * @property \App\Model\Entity\StateGroup $state_group
 */
class TransactionGroupCreate extends Entity
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
        'group_public_key' => true,
        'state_group_id' => true,
        'name' => true,
        'transaction' => true,
        'state_group' => true
    ];
}
