<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * TransactionTypes Model
 *
 * @property \App\Model\Table\TransactionsTable&\Cake\ORM\Association\HasMany $Transactions
 *
 * @method \App\Model\Entity\TransactionType get($primaryKey, $options = [])
 * @method \App\Model\Entity\TransactionType newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\TransactionType[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\TransactionType|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionType saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionType patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionType[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionType findOrCreate($search, callable $callback = null, $options = [])
 */
class TransactionTypesTable extends Table
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

        $this->setTable('transaction_types');
        $this->setDisplayField('name');
        $this->setPrimaryKey('id');

        $this->hasMany('Transactions', [
            'foreignKey' => 'transaction_type_id'
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
            ->maxLength('name', 24)
            ->requirePresence('name', 'create')
            ->notEmptyString('name');

        $validator
            ->scalar('text')
            ->maxLength('text', 255)
            ->allowEmptyString('text');

        return $validator;
    }
}
