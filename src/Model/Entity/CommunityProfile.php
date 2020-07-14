<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * CommunityProfile Entity
 *
 * @property int $id
 * @property string|resource|null $profile_img
 * @property string|null $profile_desc
 */
class CommunityProfile extends Entity
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
        'profile_img' => true,
        'profile_desc' => true,
    ];
}
