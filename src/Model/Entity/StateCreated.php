<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * StateCreated Entity
 *
 * @property int $id
 * @property int $transaction_id
 * @property int $month
 * @property int $year
 * @property int $state_user_id
 * @property \Cake\I18n\FrozenTime $created
 * @property int $short_ident_hash
 *
 * @property \App\Model\Entity\Transaction $transaction
 * @property \App\Model\Entity\StateUser $state_user
 */
class StateCreated extends Entity
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
        'month' => true,
        'year' => true,
        'state_user_id' => true,
        'created' => true,
        'short_ident_hash' => true,
        'transaction' => true,
        'state_user' => true
    ];
}
