<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * StateGroups Model
 *
 * @property \App\Model\Table\IndicesTable&\Cake\ORM\Association\BelongsTo $Indices
 * @property \App\Model\Table\StateGroupAddressesTable&\Cake\ORM\Association\HasMany $StateGroupAddresses
 * @property \App\Model\Table\StateUsersTable&\Cake\ORM\Association\HasMany $StateUsers
 * @property \App\Model\Table\TransactionGroupCreatesTable&\Cake\ORM\Association\HasMany $TransactionGroupCreates
 * @property \App\Model\Table\TransactionsTable&\Cake\ORM\Association\HasMany $Transactions
 *
 * @method \App\Model\Entity\StateGroup get($primaryKey, $options = [])
 * @method \App\Model\Entity\StateGroup newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\StateGroup[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\StateGroup|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateGroup saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateGroup patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\StateGroup[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\StateGroup findOrCreate($search, callable $callback = null, $options = [])
 */
class StateGroupsTable extends Table
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

        $this->setTable('state_groups');
        $this->setDisplayField('name');
        $this->setPrimaryKey('id');

        $this->belongsTo('Indices', [
            'foreignKey' => 'index_id',
            'joinType' => 'INNER'
        ]);
        $this->hasMany('StateGroupAddresses', [
            'foreignKey' => 'state_group_id'
        ]);
        $this->hasMany('StateUsers', [
            'foreignKey' => 'state_group_id'
        ]);
        $this->hasMany('TransactionGroupCreates', [
            'foreignKey' => 'state_group_id'
        ]);
        $this->hasMany('Transactions', [
            'foreignKey' => 'state_group_id'
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
            ->scalar('name')
            ->maxLength('name', 50)
            ->requirePresence('name', 'create')
            ->notEmptyString('name');

        $validator
            ->requirePresence('root_public_key', 'create')
            ->notEmptyString('root_public_key');

        $validator
            ->notEmptyString('user_count');

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
        $rules->add($rules->existsIn(['index_id'], 'Indices'));

        return $rules;
    }
}
