<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * StateRelationshipTypes Model
 *
 * @method \App\Model\Entity\StateRelationshipType get($primaryKey, $options = [])
 * @method \App\Model\Entity\StateRelationshipType newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\StateRelationshipType[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\StateRelationshipType|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateRelationshipType saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateRelationshipType patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\StateRelationshipType[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\StateRelationshipType findOrCreate($search, callable $callback = null, $options = [])
 */
class StateRelationshipTypesTable extends Table
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

        $this->setTable('state_relationship_types');
        $this->setDisplayField('name');
        $this->setPrimaryKey('id');
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

        $validator
            ->scalar('name')
            ->maxLength('name', 25)
            ->requirePresence('name', 'create')
            ->notEmptyString('name');

        $validator
            ->scalar('text')
            ->maxLength('text', 255)
            ->allowEmptyString('text');

        return $validator;
    }
}
