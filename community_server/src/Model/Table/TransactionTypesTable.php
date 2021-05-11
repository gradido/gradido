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
class TransactionTypesTable extends AppTable
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
            ->maxLength('name', 45)
            ->requirePresence('name', 'create')
            ->notEmptyString('name');

        $validator
            ->scalar('text')
            ->maxLength('text', 255)
            ->allowEmptyString('text');

        return $validator;
    }
    
    public function fillWithDefault()
    {

        $entry_contents = [
            [
                'id' => 1,
                'name' => 'creation',
                'text' => 'create new gradidos for member and also for group (in development)', 
            ], [   
                'id' => 2,
                'name' => 'transfer',
                'text' => 'send gradidos from one member to another, also cross group transfer', 
            ], [
                'id' => 3,
                'name' => 'group create',
                'text' => 'create a new group, trigger creation of new hedera topic and new blockchain on node server'
            ], [
                'id' => 4,
                'name' => 'group add member',
                'text' => 'add user to a group or move if he was already in a group'
            ], [
                'id' => 5,
                'name' => 'group remove member',
                'text' => 'remove user from group, maybe he was moved elsewhere'
            ],[
                'id' => 6,
                'name' => 'hedera topic create',
                'text' => 'create new topic on hedera'
            ],[
                'id' => 7, 
                'name' => 'hedera topic send message',
                'text' => 'send consensus message over hedera topic'
             ],[
                'id' => 8,
                'name' => 'hedera account create', 
                'text' => 'create new account on hedera for holding some founds with unencrypted keys'
             ],[
                'id' => 9,
                'name' => 'decay start',
                'text' => 'signalize the starting point for decay calculation, allowed only once per chain'
            ]
        ];
        $entities = $this->newEntities($entry_contents);
        $this->truncate();
        $save_results = $this->saveManyWithErrors($entities);
        if(!$save_results['success']) {
            $save_results['msg'] = 'error by saving default transaction types';
        }
        return $save_results;
    }
}
