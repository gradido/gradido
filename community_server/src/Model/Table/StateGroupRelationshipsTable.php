<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * StateGroupRelationships Model
 *
 * @property \App\Model\Table\StateGroup1sTable&\Cake\ORM\Association\BelongsTo $StateGroup1s
 * @property \App\Model\Table\StateGroup2sTable&\Cake\ORM\Association\BelongsTo $StateGroup2s
 * @property \App\Model\Table\StateRelationshipsTable&\Cake\ORM\Association\BelongsTo $StateRelationships
 *
 * @method \App\Model\Entity\StateGroupRelationship get($primaryKey, $options = [])
 * @method \App\Model\Entity\StateGroupRelationship newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\StateGroupRelationship[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\StateGroupRelationship|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateGroupRelationship saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateGroupRelationship patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\StateGroupRelationship[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\StateGroupRelationship findOrCreate($search, callable $callback = null, $options = [])
 */
class StateGroupRelationshipsTable extends Table
{
    /**
     * Initialize method
     *
     * @param array $config The configuration for the Table.
     * @return void
     */
    public function initialize(array $config)
    {
        parent::initialize($config);

        $this->setTable('state_group_relationships');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->belongsTo('StateGroup1s', [
            'foreignKey' => 'state_group1_id',
            'joinType' => 'INNER'
        ]);
        $this->belongsTo('StateGroup2s', [
            'foreignKey' => 'state_group2_id',
            'joinType' => 'INNER'
        ]);
        $this->belongsTo('StateRelationships', [
            'foreignKey' => 'state_relationship_id',
            'joinType' => 'INNER'
        ]);
    }

    /**
     * Default validation rules.
     *
     * @param \Cake\Validation\Validator $validator Validator instance.
     * @return \Cake\Validation\Validator
     */
    public function validationDefault(Validator $validator)
    {
        $validator
            ->integer('id')
            ->allowEmptyString('id', null, 'create');

        return $validator;
    }

    /**
     * Returns a rules checker object that will be used for validating
     * application integrity.
     *
     * @param \Cake\ORM\RulesChecker $rules The rules object to be modified.
     * @return \Cake\ORM\RulesChecker
     */
    public function buildRules(RulesChecker $rules)
    {
        $rules->add($rules->existsIn(['state_group1_id'], 'StateGroup1s'));
        $rules->add($rules->existsIn(['state_group2_id'], 'StateGroup2s'));
        $rules->add($rules->existsIn(['state_relationship_id'], 'StateRelationships'));

        return $rules;
    }
}
