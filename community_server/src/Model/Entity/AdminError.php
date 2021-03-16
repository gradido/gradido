<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * AdminError Entity
 *
 * @property int $id
 * @property int $state_user_id
 * @property string $controller
 * @property string $action
 * @property string $state
 * @property string $msg
 * @property string $details
 * @property \Cake\I18n\FrozenTime $created
 *
 * @property \App\Model\Entity\StateUser $state_user
 */
class AdminError extends Entity
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
        'controller' => true,
        'action' => true,
        'state' => true,
        'msg' => true,
        'details' => true,
        'created' => true,
        'state_user' => true
    ];
}
