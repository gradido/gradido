<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * TransactionSendCoins Model
 *
 * @property \App\Model\Table\TransactionsTable&\Cake\ORM\Association\BelongsTo $Transactions
 * @property \App\Model\Table\StateUsersTable&\Cake\ORM\Association\BelongsTo $StateUsers
 * @property \App\Model\Table\ReceiverUsersTable&\Cake\ORM\Association\BelongsTo $ReceiverUsers
 *
 * @method \App\Model\Entity\TransactionSendCoin get($primaryKey, $options = [])
 * @method \App\Model\Entity\TransactionSendCoin newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\TransactionSendCoin[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\TransactionSendCoin|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionSendCoin saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionSendCoin patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionSendCoin[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionSendCoin findOrCreate($search, callable $callback = null, $options = [])
 */
class TransactionSendCoinsTable extends Table
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

        $this->setTable('transaction_send_coins');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->belongsTo('Transactions', [
            'foreignKey' => 'transaction_id',
            'joinType' => 'INNER'
        ]);
        $this->belongsTo('StateUsers', [
            'foreignKey' => 'state_user_id',
            'joinType' => 'INNER'
        ]);
        $this->belongsTo('ReceiverUsers', [
            'className' => 'StateUsers',
            'foreignKey' => 'receiver_user_id',
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
            ->requirePresence('receiver_public_key', 'create')
            ->notEmptyString('receiver_public_key');

        $validator
            ->requirePresence('amount', 'create')
            ->notEmptyString('amount');

        $validator
            ->requirePresence('sender_final_balance', 'create')
            ->notEmptyString('sender_final_balance');

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
        $rules->add($rules->existsIn(['state_user_id'], 'StateUsers'));
        $rules->add($rules->existsIn(['receiver_user_id'], 'ReceiverUsers'));

        return $rules;
    }
}
