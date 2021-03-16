<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * TransactionGroupAddaddress Model
 *
 * @property \App\Model\Table\TransactionsTable&\Cake\ORM\Association\BelongsTo $Transactions
 * @property \App\Model\Table\AddressTypesTable&\Cake\ORM\Association\BelongsTo $AddressTypes
 *
 * @method \App\Model\Entity\TransactionGroupAddaddres get($primaryKey, $options = [])
 * @method \App\Model\Entity\TransactionGroupAddaddres newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\TransactionGroupAddaddres[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\TransactionGroupAddaddres|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionGroupAddaddres saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionGroupAddaddres patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionGroupAddaddres[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionGroupAddaddres findOrCreate($search, callable $callback = null, $options = [])
 */
class TransactionGroupAddaddressTable extends Table
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

        $this->setTable('transaction_group_addaddress');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->belongsTo('Transactions', [
            'foreignKey' => 'transaction_id',
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
        $rules->add($rules->existsIn(['transaction_id'], 'Transactions'));
        $rules->add($rules->existsIn(['address_type_id'], 'AddressTypes'));

        return $rules;
    }
}
