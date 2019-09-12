<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * StateGroup Entity
 *
 * @property int $id
 * @property string|resource $index_id
 * @property string $name
 * @property string|resource $root_public_key
 * @property int $user_count
 *
 * @property \App\Model\Entity\Index $index
 * @property \App\Model\Entity\StateGroupAddress[] $state_group_addresses
 * @property \App\Model\Entity\StateUser[] $state_users
 * @property \App\Model\Entity\TransactionGroupCreate[] $transaction_group_creates
 * @property \App\Model\Entity\Transaction[] $transactions
 */
class StateGroup extends Entity
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
        'index_id' => true,
        'name' => true,
        'root_public_key' => true,
        'user_count' => true,
        'index' => true,
        'state_group_addresses' => true,
        'state_users' => true,
        'transaction_group_creates' => true,
        'transactions' => true
    ];
}
