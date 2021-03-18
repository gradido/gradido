<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * TransactionGroupCreates Model
 *
 * @property \App\Model\Table\TransactionsTable&\Cake\ORM\Association\BelongsTo $Transactions
 * @property \App\Model\Table\StateGroupsTable&\Cake\ORM\Association\BelongsTo $StateGroups
 *
 * @method \App\Model\Entity\TransactionGroupCreate get($primaryKey, $options = [])
 * @method \App\Model\Entity\TransactionGroupCreate newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\TransactionGroupCreate[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\TransactionGroupCreate|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionGroupCreate saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionGroupCreate patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionGroupCreate[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionGroupCreate findOrCreate($search, callable $callback = null, $options = [])
 */
class TransactionGroupCreatesTable extends Table
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

        $this->setTable('transaction_group_creates');
        $this->setDisplayField('name');
        $this->setPrimaryKey('id');

        $this->belongsTo('Transactions', [
            'foreignKey' => 'transaction_id',
            'joinType' => 'INNER'
        ]);
        $this->belongsTo('StateGroups', [
            'foreignKey' => 'state_group_id',
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
            ->requirePresence('group_public_key', 'create')
            ->notEmptyString('group_public_key');

        $validator
            ->scalar('name')
            ->maxLength('name', 64)
            ->requirePresence('name', 'create')
            ->notEmptyString('name');

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
        $rules->add($rules->existsIn(['transaction_id'], 'Transactions'));
        $rules->add($rules->existsIn(['state_group_id'], 'StateGroups'));

        return $rules;
    }
}
