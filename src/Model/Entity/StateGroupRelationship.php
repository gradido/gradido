<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * StateGroupRelationship Entity
 *
 * @property int $id
 * @property int $state_group1_id
 * @property int $state_group2_id
 * @property int $state_relationship_id
 *
 * @property \App\Model\Entity\StateGroup1 $state_group1
 * @property \App\Model\Entity\StateGroup2 $state_group2
 * @property \App\Model\Entity\StateRelationship $state_relationship
 */
class StateGroupRelationship extends Entity
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
        'state_group1_id' => true,
        'state_group2_id' => true,
        'state_relationship_id' => true,
        'state_group1' => true,
        'state_group2' => true,
        'state_relationship' => true
    ];
}
