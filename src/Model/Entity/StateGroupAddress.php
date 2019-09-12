<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * StateGroupAddress Entity
 *
 * @property int $id
 * @property int $state_group_id
 * @property string|resource $public_key
 * @property int $address_type_id
 *
 * @property \App\Model\Entity\StateGroup $state_group
 * @property \App\Model\Entity\AddressType $address_type
 */
class StateGroupAddress extends Entity
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
        'public_key' => true,
        'address_type_id' => true,
        'state_group' => true,
        'address_type' => true
    ];
}
