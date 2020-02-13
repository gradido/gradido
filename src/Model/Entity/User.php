<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * User Entity
 *
 * @property int $id
 * @property string $email
 * @property string $first_name
 * @property string|null $last_name
 * @property int $password
 * @property string|resource|null $pubkey
 * @property string|resource|null $privkey
 * @property \Cake\I18n\FrozenTime $created
 * @property bool $email_checked
 * @property string $language
 *
 * @property \App\Model\Entity\EmailOptIn[] $email_opt_in
 * @property \App\Model\Entity\UserBackup[] $user_backups
 * @property \App\Model\Entity\UserRole[] $user_roles
 */
class User extends Entity
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
        'email' => true,
        'first_name' => true,
        'last_name' => true,
        'password' => true,
        'pubkey' => true,
        'privkey' => true,
        'created' => true,
        'email_checked' => true,
        'language' => true,
        'email_opt_in' => true,
        'user_backups' => true,
        'user_roles' => true,
    ];

    /**
     * Fields that are excluded from JSON versions of the entity.
     *
     * @var array
     */
    protected $_hidden = [
        'password',
    ];
}
