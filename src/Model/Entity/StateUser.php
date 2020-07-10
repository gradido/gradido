<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * StateUser Entity
 *
 * @property int $id
 * @property int $index_id
 * @property int $state_group_id
 * @property string|resource $public_key
 *
 * @property \App\Model\Entity\Index $index
 * @property \App\Model\Entity\StateGroup $state_group
 * @property \App\Model\Entity\StateBalance[] $state_balances
 * @property \App\Model\Entity\StateCreated[] $state_created
 * @property \App\Model\Entity\TransactionCreation[] $transaction_creations
 * @property \App\Model\Entity\TransactionSendCoin[] $transaction_send_coins
 */
class StateUser extends Entity
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
        'state_group_id' => true,
        'public_key' => true,
        'email' => true,
        'first_name' => true,
        'last_name' => true,
        'user_name' => true,
        'index' => true,
        'state_group' => true,
        'state_balances' => true,
        'state_created' => true,
        'transaction_creations' => true,
        'transaction_send_coins' => true
    ];

    public function getEmailWithName()
    {
        return $this->first_name . ' ' . $this->last_name . ' <' . $this->email . '>';
    }

    public function getNames()
    {
        return $this->first_name . ' ' . $this->last_name;
    }
}
