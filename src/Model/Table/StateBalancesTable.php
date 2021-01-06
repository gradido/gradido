<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

use Cake\ORM\TableRegistry;
use Cake\I18n\Date;

/**
 * StateBalances Model
 *
 * @property \App\Model\Table\StateUsersTable&\Cake\ORM\Association\BelongsTo $StateUsers
 *
 * @method \App\Model\Entity\StateBalance get($primaryKey, $options = [])
 * @method \App\Model\Entity\StateBalance newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\StateBalance[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\StateBalance|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateBalance saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateBalance patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\StateBalance[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\StateBalance findOrCreate($search, callable $callback = null, $options = [])
 *
 * @mixin \Cake\ORM\Behavior\TimestampBehavior
 */
class StateBalancesTable extends Table
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

        $this->setTable('state_balances');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->addBehavior('Timestamp');

        $this->belongsTo('StateUsers', [
            'foreignKey' => 'state_user_id',
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
            ->requirePresence('amount', 'create')
            ->notEmptyString('amount');

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
        $rules->add($rules->existsIn(['state_user_id'], 'StateUsers'));

        return $rules;
    }
    
    private function calculateStateBalance($previousStateBalance)
    {
        $entity = $this->newEntity();
        $entity->state_user_id = $previousStateBalance->state_user_id;
        $newDate = $previousStateBalance->record_date;
        $newDate->day(1);
        if($newDate->month > 12) {
            $newDate->month($newDate->month + 1);
        } else {
            $newDate->month(1);
            $newDate->year($newDate->year + 1);
        }
        $entity->record_date = $newDate;
        $entity->amount = $previousStateBalance->partDecay($newDate);
        if($this->save($entity)) {
            return $entity;
        }
        return ['state' => 'error', 'msg' => 'couldn\'t save', 'details' => $entity->getErrors()];
    }
    
    // getting start balance for month, if exist else create and create all missing state_balances before, recursive
    public function chooseForMonthAndUser($month, $year, $state_user_id)
    {
        //'created' => 'identifier'
        $query = $this->find('all');
        $query->select([
            'month' => $query->func()->month(['record_date' => 'identifier']),
            'year'  => $query->func()->year(['record_date' => 'identifier'])
        ])->select($this)
          //->where(['month' => $month, 'year' => $year, 'state_user_id' => $state_user_id])
          ->where(['state_user_id' => $state_user_id])
          ->contain([]);
        // TODO: fix query with correct month and year
        //debug($query);
        if($query->count() == 0) 
        {
            
            // if any state balance for user exist, pick last one
            $state_balances = $this->find('all')
                    ->where(['state_user_id' => $state_user_id])
                    ->limit(1)
                    ->order(['record_date' => 'DESC'])
                    ;
            if($state_balances->count() == 1) 
            {
                $current_state_balance = $state_balances->first();
                while(true)
                {
                    $new_state_balance = $this->calculateStateBalance($current_state_balance);
                    if(is_array($new_state_balance)) {
                        return ['state' => 'error', 'msg' => 'error calculate state balance', 'details' => $new_state_balance];
                    }
                    $record_date = $new_state_balance->record_date;
                    if($record_date->month === $month && $record_date->year === $year) {
                        return $new_state_balance;
                    }
                    $current_state_balance = $new_state_balance;
                }
            } 
            // else create one for first user transaction
            else 
            {
                $state_user_transactions_table = TableRegistry::getTableLocator()->get('StateUserTransactions');
                $state_user_transaction = $state_user_transactions_table->find('all')
                        ->where(['state_user_id' => $state_user_id, 'StateUserTransactions.transaction_type_id <' => 3])
                        ->contain(['Transactions' => ['TransactionCreations', 'TransactionSendCoins']])
                        ->limit(1)
                        ->order(['transaction_id' => 'ASC'])
                        ->first()
                        ;
                if(!$state_user_transaction) {
                    return null;
                }
                $entity = $this->newEntity();
                $entity->state_user_id = $state_user_id;
                if($state_user_transaction->transaction_type_id == 1) {
                    $creation = $state_user_transaction->transaction->transaction_creations[0];
                    $entity->amount = $creation->amount;
                    $entity->record_date = $creation->target_date;
                } else if($state_user_transaction->transaction_type_id == 2) {
                    $transfer = $state_user_transaction->transaction->transaction_send_coins[0];
                    $entity->amount = $transfer->amount;
                    $entity->record_date = $state_user_transaction->transaction->received;
                }
                if(!$this->save($entity)) {
                    return ['state' => 'error', 'msg' => 'error by saving state balance', 'details' => $entity->getErrors()];
                } else {
                    return $entity;
                }
            }
            
            
        }
        return $query->first();
    }
}
