<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * Transactions Model
 *
 * @property \App\Model\Table\StateGroupsTable&\Cake\ORM\Association\BelongsTo $StateGroups
 * @property \App\Model\Table\TransactionTypesTable&\Cake\ORM\Association\BelongsTo $TransactionTypes
 * @property \App\Model\Table\StateCreatedTable&\Cake\ORM\Association\HasMany $StateCreated
 * @property \App\Model\Table\TransactionCreationsTable&\Cake\ORM\Association\HasMany $TransactionCreations
 * @property \App\Model\Table\TransactionGroupAddaddressTable&\Cake\ORM\Association\HasMany $TransactionGroupAddaddress
 * @property \App\Model\Table\TransactionGroupAllowtradesTable&\Cake\ORM\Association\HasMany $TransactionGroupAllowtrades
 * @property \App\Model\Table\TransactionGroupCreatesTable&\Cake\ORM\Association\HasMany $TransactionGroupCreates
 * @property \App\Model\Table\TransactionSendCoinsTable&\Cake\ORM\Association\HasMany $TransactionSendCoins
 * @property \App\Model\Table\TransactionSignaturesTable&\Cake\ORM\Association\HasMany $TransactionSignatures
 *
 * @method \App\Model\Entity\Transaction get($primaryKey, $options = [])
 * @method \App\Model\Entity\Transaction newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\Transaction[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\Transaction|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\Transaction saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\Transaction patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\Transaction[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\Transaction findOrCreate($search, callable $callback = null, $options = [])
 */
class TransactionsTable extends Table
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

        $this->setTable('transactions');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->belongsTo('StateGroups', [
            'foreignKey' => 'state_group_id',
            'joinType' => 'INNER'
        ]);
        $this->belongsTo('TransactionTypes', [
            'foreignKey' => 'transaction_type_id',
            'joinType' => 'INNER'
        ]);
        $this->hasMany('StateCreated', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasMany('TransactionCreations', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasMany('TransactionGroupAddaddress', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasMany('TransactionGroupAllowtrades', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasMany('TransactionGroupCreates', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasMany('TransactionSendCoins', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasMany('TransactionSignatures', [
            'foreignKey' => 'transaction_id'
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
            ->allowEmptyString('id', null, 'create');

        $validator
            ->requirePresence('tx_hash', 'create')
            ->notEmptyString('tx_hash');

        $validator
            ->dateTime('received')
            ->notEmptyDateTime('received');

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
        $rules->add($rules->existsIn(['transaction_type_id'], 'TransactionTypes'));

        return $rules;
    }
}
