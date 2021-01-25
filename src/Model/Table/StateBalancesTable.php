<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

use Cake\ORM\TableRegistry;
use Cake\I18n\Date;
use Cake\I18n\Time;

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
    /*
     * create new state balance at beginning of next month from $previousStateBalance
     * calculate decay for the time diff
     */
    private function calculateStateBalance($previousStateBalance)
    {
        $entity = $this->newEntity();
        $entity->state_user_id = $previousStateBalance->state_user_id;
        $newDate = $previousStateBalance->record_date;
        $newDate->day(1);
        if($newDate->month <= 12) {
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
    
    public function sortTransactions($a, $b)
    {
        if ($a['date'] == $b['date']) {
            return 0;
        }
        return ($a['date'] > $b['date']) ? -1 : 1;
    }
    /*
     * calculate balance at end of month 
     * work only if state balance at begin of month exist
     * use transaction_send_coins and transaction_creations
     */
    public function updateLastStateBalanceOfMonth($month, $year, $state_user_id)
    {
        $first_of_month = new Time("$year-$month-01 00:00");
        $last_of_month = new Time($first_of_month);
        $last_of_month->addMonth(1);
        $last_of_month->subSecond(1);
        $query = $this->find('all')
                      ->where(['AND' => [
                          'state_user_id' => $state_user_id,
                          'record_date >=' => $first_of_month,
                          'record_date <=' => $last_of_month
                      ]])
                      ->order(['record_date' => 'ASC']);
        if($query->isEmpty()) {
            return [
                'state' => 'error', 
                'msg' => 'no state balance in this month found', 
                'details' => [
                    'month' => $month,
                    'year' => $year,
                    'state_user_id' => $state_user_id
                ]
            ];
        }
        // get transactions from this month
        $balance_changes = [];
        $transactionCreationsTable = TableRegistry::getTableLocator()->get('TransactionCreations');
        $transactionTransfersTable = TableRegistry::getTableLocator()->get('TransactionSendCoins');
        $relevant_creations = $transactionCreationsTable
                                ->find('all')
                                ->where(['AND' => [
                                    'state_user_id' => $state_user_id,
                                    'target_date >=' => $first_of_month,
                                    'target_date <=' => $last_of_month
                                ]])->contain(false);
        foreach($relevant_creations as $creation) {
            $balance_changes[] = ['amount' => $creation->amount, 'date' => $creation->target_date];
        }
        $relevant_transfers = $transactionTransfersTable
                                ->find('all')
                                ->where(['AND' => [
                                    'OR' => [
                                        'state_user_id' => $state_user_id,
                                        'receiver_user_id' => $state_user_id
                                    ],
                                    'transaction.received >= ' => $first_of_month,
                                    'transaction.received <=' => $last_of_month
                                ]])->contain(['Transactions']);
        debug($relevant_transfers);
        foreach($relevant_transfers as $transfer) {
            $amount = $transfer->amount;
            // if it is a send transaction, negate the value
            if($transfer->state_user_id == $state_user_id) {
                $amount *= -1.0;
            }
            $balance_changes[] = ['amount' => $amount, 'date' => $transfer->transaction->received];
        }
        uasort($balance_changes, array($this, 'sortTransactions'));
        $current_state_balance = null;
        if($query->count() == 1) {
            $current_state_balance = $this->newEntity();
            $current_state_balance->amount = $query->first()->amount;
            $current_state_balance->state_user_id = $state_user_id;
            $current_state_balance->record_date = $query->first()->record_date;
        } else if($query->count() == 2) {
            $array = $query->toArray();
            $current_state_balance = $array[1];
        } else {
            throw new Exception('Should\'n occure, never');
        }
        
        foreach($balance_changes as $change) {
            $current_state_balance->amount = $current_state_balance->getDecay($change['date']);
            $current_state_balance->amount += $change['amount'];
            $current_state_balance->record_date = $change['date'];
        }
        if(!$this->save($current_state_balance)) {
            return ['state' => 'error', 'msg' => 'couldn\'t save', 'details' => $current_state_balance->getErrors()];
        }
        return $current_state_balance;
    }
    
    /*
     * getting start balance for month
     * create and create all missing state_balances before if not exist 
     * in while loop
     */
    
    public function chooseForMonthAndUser($month, $year, $state_user_id)
    {
        $first_of_month = new Time("$year-$month-01 00:00");
        $last_of_month = new Time($first_of_month);
        $last_of_month->addMonth(1);
        $last_of_month->subSecond(1);
        //echo "first of month: " . $first_of_month->i18nFormat() . ", last of month: " . $last_of_month->i18nFormat() . "<br>";
        $query = $this->find('all');
                      
        $query->select([
            'month' => $query->func()->month(['record_date' => 'identifier']),
            'year'  => $query->func()->year(['record_date' => 'identifier'])
        ])->select($this)
          //->where(['month' => $month, 'year' => $year, 'state_user_id' => $state_user_id])
          ->where(['AND' => [
                    'state_user_id' => $state_user_id,
                    'record_date >=' => $first_of_month,
                    'record_date <=' => $last_of_month
                   ]
                  ])
          ->order(['record_date' => 'ASC'])     
          ->limit(1)
          ->contain([]);
        if($query->count() == 0) 
        {   
            // if any state balance for user exist, pick last one
            $state_balances = $this->find('all')
                    ->where(['state_user_id' => $state_user_id])
                    ->limit(1)
                    ->order(['record_date' => 'DESC'])
                    ;
            // create one for first user transaction
            if($state_balances->isEmpty()) 
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
                }
            }
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
                    $new_state_balance_begin = $this->calculateStateBalance($current_state_balance);
                    if(is_array($new_state_balance_begin)) {
                        return ['state' => 'error', 'msg' => 'error calculate state balance', 'details' => $new_state_balance_begin];
                    }
                    $record_date = $new_state_balance_begin->record_date;
                    if($record_date->month === $month && $record_date->year === $year) {
                        return $new_state_balance_begin;
                    }
                    $current_state_balance = $this->updateLastStateBalanceOfMonth($month, $year, $state_user_id);
                }
            } 
            else 
            {
                return ['state' => 'error', 'msg' => 'creation of first state_balance failes'];
            }
        }
        return $query->first();
    }
    
    public function updateBalanceWithTransaction($newBalance, $recordDate, $userId)
    {
        // max 2 StateBalance Entrys per month:
        // 1. first of month or first transaction of user
        // 2. last of month or last transaction of user
        $first_state_balance_of_month = $this->chooseForMonthAndUser($recordDate->month, $recordDate->year, $userId);
        $updated_state_balance = null;
        
        if($first_state_balance_of_month == null || is_array($first_state_balance_of_month)) {
            return $first_state_balance_of_month;
        }
        
        if($first_state_balance_of_month->record_date->day == $recordDate->day && 
           $recordDate > $first_state_balance_of_month->record_date) {
            if($first_state_balance_of_month->amount == $newBalance) {
                // nothing to do here
                return true;
            }
            $updated_state_balance = $first_state_balance_of_month;
            $updated_state_balance->amount = $newBalance;
            // copy complete record date, inclusive time
            $first_state_balance_of_month->record_date = $recordDate;
        } else {
            $query = $this->find('all')
                          ->where(['AND' => [
                                    'record_date >' => $first_state_balance_of_month->record_date,
                                    'record_date <=' => $recordDate,
                                    'state_user_id' => $userId
                                  ]]);
            if(!$query->isEmpty()) {
                $updated_state_balance = $query->first();
                if($updated_state_balance->record_date == $recordDate) {
                    return true;
                }
            } else {
                $updated_state_balance = $this->newEntity();
                $updated_state_balance->state_user_id = $userId;
            }
            $updated_state_balance->record_date = $recordDate;
            $updated_state_balance->amount = $newBalance;   
        }
        
        if($updated_state_balance) {
            if(!$this->save($updated_state_balance)) {
                return ['state' => 'error', 'msg' => 'error by saving state balance', 'details' => $entity->getErrors()];
            } 
            
            // delete all state_balances which came after
            // they will be automaticlly recovered by next call of chooseForMonthAndUser
            $this->deleteAll(['state_user_id' => $userId, 'record_date >' => $recordDate]);
        }

        return true;        
    }
}
