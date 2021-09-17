<?php
namespace App\Model\Table;

use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

use Cake\ORM\TableRegistry;
use Cake\I18n\FrozenTime;

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
class StateBalancesTable extends AppTable
{
    private static $startDecayDate = null;
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
    
    public static function getDecayStartDateCached()
    {
        if(self::$startDecayDate == null) {
            $transactionsTable = TableRegistry::getTableLocator()->get('Transactions');
            self::$startDecayDate = $transactionsTable->getDecayStartDate();
        }
        return self::$startDecayDate;
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
    
    public function calculateDecay($startBalance, FrozenTime $startDate, FrozenTime $endDate, $withInterval = false)
    {
        $decayStartDate = self::getDecayStartDateCached();
        // if no start decay block exist, we just return input
        // if start date for decay is after enddate, we also just return input
        if($decayStartDate === null || $decayStartDate >= $endDate) {
            if($withInterval) {
                return [
                    'balance' => $startBalance,
                    'interval' => new \DateInterval('PT0S'),
                    'start_date' => $startDate->getTimestamp(),
                    'end_date' => $startDate->getTimestamp()
                ];
            } else {
                return $startBalance;
            }
        }
        $state_balance = $this->newEntity();
        $state_balance->amount = $startBalance;
        $interval = null;
        // if decay start date is before start date we calculate decay for full duration
        if($decayStartDate < $startDate) {
            $state_balance->record_date = $startDate;
            $interval = $endDate->diff($startDate);
        } 
        // if decay start in between start date and end date we caculcate decay from decay start time to end date
        else {
            $state_balance->record_date = $decayStartDate;
            $interval = $endDate->diff($decayStartDate);
        }
        $decay = $state_balance->partDecay($endDate);
        if($withInterval) {
            return [
                'balance' => $decay,
                'interval' => $interval,
                'start_date' => $state_balance->record_date->getTimestamp(),
                'end_date' => $endDate->getTimestamp()
            ];
        } else {
            return $decay;
        }
        
        
    }
    
    public function updateAllBalances()
    {
        $stateUserTable =  TableRegistry::getTableLocator()->get('StateUsers');
        $state_users = $stateUserTable->find()->select(['id'])->contain([]);
        foreach($state_users as $state_user) {
            $result = $this->updateBalances($state_user->id);
            if($result['success'] === false) {
                $result['state_user_id'] = $state_user->id;
                return $result;
            }
        }
        return ['success' => true];
    }
    
    public function updateBalances($stateUserId)
    {
        $stateUserTransactionsTable =  TableRegistry::getTableLocator()->get('StateUserTransactions');
        $transactionsTable = TableRegistry::getTableLocator()->get('Transactions');
        $now = new FrozenTime;
        // info: cakephp use lazy loading, query will be executed later only if needed
        $state_balances = $this->find('all')->where(['state_user_id' => $stateUserId]);
        $state_user_transactions = $stateUserTransactionsTable
                                            ->find()
                                            ->where(['state_user_id' => $stateUserId])
                                            ->order(['balance_date ASC'])
                                            //->contain(false);
                                            ;
        
        if(!$state_user_transactions || !$state_user_transactions->count()) {
            return ['success' => true];
        }
        
        // first: decide what todo
        $create_state_balance = false;
        $recalculate_state_user_transactions_balance = false;
        $clear_state_balance = false;
        $update_state_balance = false;
        if($state_balances->count() == 0) {
            $create_state_balance = true;
            $recalculate_state_user_transactions_balance = true;
        }
        if($state_balances->count() > 1) {
            $clear_state_balance = true;
            $create_state_balance = true;
            $recalculate_state_user_transactions_balance = true;
        }
        if($state_balances->count() == 1) {            
            if($state_user_transactions->count() == 0){
                $clear_state_balance = true;
            } else {
                
                $first_state_balance = $state_balances->first();
                $first_state_balance_decayed = self::calculateDecay(
                        $first_state_balance->amount, 
                        $first_state_balance->record_date,
                        $now);
                
                $last_state_user_transaction = $state_user_transactions->last();
                $last_state_user_transaction_decayed = self::calculateDecay(
                        $last_state_user_transaction->balance, 
                        $last_state_user_transaction->balance_date, 
                        $now);
                // if entrys are nearly the same, we don't need doing anything
                if(floor($last_state_user_transaction_decayed/100) !== floor($first_state_balance_decayed/100)) {
                    $recalculate_state_user_transactions_balance = true;
                    $update_state_balance = true;
                }
            }
        }

        if(!$recalculate_state_user_transactions_balance) {
            $last_state_user_transaction = $state_user_transactions->last();
            if($last_state_user_transaction && $last_state_user_transaction->balance <= 0) {
                $recalculate_state_user_transactions_balance = true;
                if(!$create_state_balance) {
                    $update_state_balance = true;
                }
            } else if(!$last_state_user_transaction) {
                
                $creationsTable = TableRegistry::getTableLocator()->get('TransactionCreations');
                $creationTransactions = $creationsTable
                    ->find('all')
                    ->where(['state_user_id' => $stateUserId])
                    ->contain(false);

                $transferTable = TableRegistry::getTableLocator()->get('TransactionSendCoins');
                $transferTransactions = $transferTable
                    ->find('all')
                    ->where(['OR' => ['state_user_id' => $stateUserId, 'receiver_user_id' => $stateUserId]])
                    ->contain(false);
                if($creationTransactions->count() > 0 || $transferTransactions->count() > 0) {
                    return ['success' => false, 'error' => 'state_user_transactions is empty but it exist transactions for user'];
                }
            }
        }
        // second: do what is needed
        if($clear_state_balance) {
            $this->deleteAll(['state_user_id' => $stateUserId]);
        }
        
        $transaction_ids = [];
        if($recalculate_state_user_transactions_balance) {
           
            $state_user_transactions_array = $state_user_transactions->toArray();
            foreach($state_user_transactions_array as $i => $state_user_transaction) {
                $transaction_ids[$state_user_transaction->transaction_id] = $i;
            }
        
            $transactions = $transactionsTable
                    ->find('all')
                    ->where(['Transactions.id IN' => array_keys($transaction_ids)])
                    ->contain(['TransactionCreations', 'TransactionSendCoins']);

            $transactions_indiced = [];
            foreach($transactions as $transaction) {
                $transactions_indiced[$transaction->id] = $transaction;
            }
            $balance_cursor = $this->newEntity();
            $i = 0;
            foreach($state_user_transactions_array as $state_user_transaction) {
                $transaction = $transactions_indiced[$state_user_transaction->transaction_id];
                if($transaction->transaction_type_id > 2) {
                    continue;
                }                
                $amount = 0;
                
                if($transaction->transaction_type_id == 1) { // creation                    
                    $amount = intval($transaction->transaction_creation->amount);
                } else if($transaction->transaction_type_id == 2) { // transfer
                    $temp = $transaction->transaction_send_coin;
                    $amount = intval($temp->amount);
                    // reverse if sender
                    if($stateUserId == $temp->state_user_id) {
                        $amount *= -1.0;
                    }
                }
                $amount_date = $transaction->received;
                if($i == 0) {
                    $balance_cursor->amount = $amount;
                } else {
                    
                    //$balance_cursor->amount = $balance_cursor->partDecay($amount_date) + $amount;
                    $balance_cursor->amount = 
                            $this->calculateDecay($balance_cursor->amount, $balance_cursor->record_date, $amount_date) 
                            + $amount;
                }
                //echo "new balance: " . $balance_cursor->amount . "<br>";
               
                $balance_cursor->record_date = $amount_date;
                $state_user_transaction_index = $transaction_ids[$transaction->id];
                $state_user_transactions_array[$state_user_transaction_index]->balance = $balance_cursor->amount;
                $state_user_transactions_array[$state_user_transaction_index]->balance_date = $balance_cursor->record_date;   
                $i++;
                
            }
            
            $results = $stateUserTransactionsTable->saveMany($state_user_transactions_array);
            $errors = [];
            foreach($results as $i => $result) {
                if(!$result) {
                    $errors[$i] = $state_user_transactions_array[$i]->getErrors();
                }
            }
            if(count($errors)) {
                return ['success' => false, 'error' => 'error saving one ore more state user transactions', 'details' => $errors];
            }
        }
        $state_balance = null;
        if($update_state_balance) {
            $state_balance = $state_balances->first();
        }
        else if($create_state_balance) {
             $state_balance = $this->newEntity();
             $state_balance->state_user_id =  $stateUserId;
        }
        if($state_balance) {
             $state_balance->amount = $state_user_transactions->last()->balance;
             $state_balance->record_date = $state_user_transactions->last()->balance_date;    
             if(!$this->save($state_balance)) {
                 return ['success' => false, 'error' => 'error saving state balance', 'details' => $state_balance->getErrors()];
             }
        }
        return ['success' => true];

    }
    
}
