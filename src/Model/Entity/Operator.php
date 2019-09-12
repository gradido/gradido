<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * Operator Entity
 *
 * @property int $id
 * @property string $username
 * @property string $data_base64
 */
class Operator extends Entity
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
        'username' => true,
        'data_base64' => true
    ];
}
