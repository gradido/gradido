<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * AddressType Entity
 *
 * @property int $id
 * @property string $name
 * @property string|null $text
 *
 * @property \App\Model\Entity\StateGroupAddress[] $state_group_addresses
 * @property \App\Model\Entity\TransactionGroupAddaddres[] $transaction_group_addaddress
 */
class AddressType extends Entity
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
        'name' => true,
        'text' => true,
        'state_group_addresses' => true,
        'transaction_group_addaddress' => true
    ];
}
