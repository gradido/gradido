<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * StateBalance Entity
 *
 * @property int $id
 * @property int $state_user_id
 * @property \Cake\I18n\FrozenTime $modified
 * @property int $amount
 *
 * @property \App\Model\Entity\StateUser $state_user
 */
class StateBalance extends Entity
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
        'modified' => true,
        'amount' => true,
        'state_user' => true
    ];
}
