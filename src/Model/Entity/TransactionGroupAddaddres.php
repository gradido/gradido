<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * TransactionGroupAddaddres Entity
 *
 * @property int $id
 * @property int $transaction_id
 * @property int $address_type_id
 * @property string|resource $public_key
 *
 * @property \App\Model\Entity\Transaction $transaction
 * @property \App\Model\Entity\AddressType $address_type
 */
class TransactionGroupAddaddres extends Entity
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
        'address_type_id' => true,
        'public_key' => true,
        'transaction' => true,
        'address_type' => true
    ];
}
