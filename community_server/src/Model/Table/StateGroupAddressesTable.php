<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * StateGroupAddresses Model
 *
 * @property \App\Model\Table\StateGroupsTable&\Cake\ORM\Association\BelongsTo $StateGroups
 * @property \App\Model\Table\AddressTypesTable&\Cake\ORM\Association\BelongsTo $AddressTypes
 *
 * @method \App\Model\Entity\StateGroupAddress get($primaryKey, $options = [])
 * @method \App\Model\Entity\StateGroupAddress newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\StateGroupAddress[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\StateGroupAddress|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateGroupAddress saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateGroupAddress patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\StateGroupAddress[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\StateGroupAddress findOrCreate($search, callable $callback = null, $options = [])
 */
class StateGroupAddressesTable extends Table
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

        $this->setTable('state_group_addresses');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->belongsTo('StateGroups', [
            'foreignKey' => 'state_group_id',
            'joinType' => 'INNER'
        ]);
        $this->belongsTo('AddressTypes', [
            'foreignKey' => 'address_type_id',
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

        $validator
            ->requirePresence('public_key', 'create')
            ->notEmptyString('public_key');

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
        $rules->add($rules->existsIn(['state_group_id'], 'StateGroups'));
        $rules->add($rules->existsIn(['address_type_id'], 'AddressTypes'));

        return $rules;
    }
}
