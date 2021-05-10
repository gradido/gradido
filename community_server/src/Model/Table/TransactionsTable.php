<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;
use Cake\ORM\TableRegistry;
use Cake\I18n\Number;
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
        $this->belongsTo('BlockchainTypes', [
           'foreignKey' => 'blockchain_type_id',
           'joinType' => 'INNER'
        ]);
        $this->hasMany('StateCreated', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasOne('TransactionCreations', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasOne('TransactionGroupAddaddress', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasOne('TransactionGroupAllowtrades', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasOne('TransactionGroupCreates', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasOne('TransactionSendCoins', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasMany('TransactionSignatures', [
            'foreignKey' => 'transaction_id'
        ]);
        $this->hasMany('StateUserTransactions', [
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
            //->requirePresence('tx_hash', 'create')
            ->allowEmptyString('tx_hash', null, 'create');
        
        $validator
            ->allowEmptyString('memo', null, 'create');

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
        $rules->add($rules->existsIn(['blockchain_type_id'], 'BlockchainTypes'));

        return $rules;
    }
    
    public function sortTransactions($a, $b)
    {
        if ($a['date'] == $b['date']) {
            return 0;
        }
        return ($a['date'] > $b['date']) ? -1 : 1;
    }

    
    public function listTransactionsHumanReadable($stateUserTransactions, array $user, $decay = true) 
    {
        
        $stateUsersTable    = TableRegistry::getTableLocator()->get('StateUsers');
        $stateBalancesTable = TableRegistry::getTableLocator()->get('StateBalances');
        
        $transaction_ids = [];
        $involved_user_ids = [];
        $stateUserTransactionsCount = 0;
        foreach($stateUserTransactions as $su_transaction) {
            $transaction_ids[] = $su_transaction->transaction_id;
            $involved_user_ids[] = $su_transaction->state_user_id;
            $stateUserTransactionsCount++;
        }
        
        $involved_users = $stateUsersTable->getUsersIndiced($involved_user_ids);
        
        $transactions = $this
                        ->find()
                        ->where(['Transactions.id IN' => $transaction_ids])
                        ->contain(['TransactionSendCoins', 'TransactionCreations'])
                        ;
        $transaction_indiced = [];
        foreach($transactions as $tr) {
            $transaction_indiced[$tr->id] = $tr;
        }
        
        $state_balance = $stateBalancesTable->newEntity();
        $final_transactions = [];
        
        foreach($stateUserTransactions as $i => $su_transaction)
        {
            /*echo "i: $i<br>";
            echo "state user transaction: <br>";
            var_dump($su_transaction);
            echo "<br>";*/
            //var_dump($su_transaction);
            //die("step");
            // add decay transactions 
            if($i > 0 && $decay == true) 
            {
                $prev = $stateUserTransactions[$i-1];
                if($prev->balance > 0) {
                //    var_dump($stateUserTransactions);
                    $current = $su_transaction;
                    //echo "decay between " . $prev->transaction_id . " and " . $current->transaction_id . "<br>";
                    $interval = $current->balance_date->diff($prev->balance_date);
                    $state_balance->amount = $prev->balance;
                    $state_balance->record_date = $prev->balance_date;
                    $diff_amount = $state_balance->partDecay($current->balance_date);
     
                    //echo $interval->format('%R%a days');
                    //echo "prev balance: " . $prev->balance . ", diff_amount: $diff_amount, summe: " . (-intval($prev->balance - $diff_amount)) . "<br>";
                    $final_transactions[] = [ 
                        'type' => 'decay',
                        'balance' => floatval(intval($prev->balance - $diff_amount)),
                        'decay_duration' => $interval->format('%a days, %H hours, %I minutes, %S seconds'),
                        'memo' => ''
                    ];
                }
            }
            
            // sender or receiver when user has sended money
            // group name if creation
            // type: gesendet / empfangen / geschöpft
            // transaktion nr / id
            // date
            // balance
            $transaction = $transaction_indiced[$su_transaction->transaction_id];
            /*echo "transaction: <br>";
            var_dump($transaction);
            echo "<br>";*/
            if($su_transaction->transaction_type_id == 1) { // creation
                $creation = $transaction->transaction_creation;
                $final_transactions[] = [
                  'name' => 'Gradido Akademie',
                  'type' => 'creation',
                  'transaction_id' => $transaction->id,
                  'date' => $transaction->received,// $creation->target_date,
                  'target_date' => $creation->target_date,
                  'balance' => $creation->amount,
                  'memo' => $transaction->memo
                ];
            } else if($su_transaction->transaction_type_id == 2) { // transfer or send coins
                $sendCoins = $transaction->transaction_send_coin;
                $type = '';
                $otherUser = null;
                $other_user_public = '';
                if ($sendCoins->state_user_id == $user['id']) {
                    $type = 'send';

                    if(isset($involved_users[$sendCoins->receiver_user_id])) {
                      $otherUser = $involved_users[$sendCoins->receiver_user_id];
                    }
                    $other_user_public = bin2hex(stream_get_contents($sendCoins->receiver_public_key));
                } else if ($sendCoins->receiver_user_id == $user['id']) {
                    $type = 'receive';
                    if(isset($involved_users[$sendCoins->state_user_id])) {
                      $otherUser = $involved_users[$sendCoins->state_user_id];
                    }
                    if($sendCoins->sender_public_key) {
                      $other_user_public = bin2hex(stream_get_contents($sendCoins->sender_public_key));
                    }
                }
                if(null == $otherUser) {
                  $otherUser = $stateUsersTable->newEntity();
                }
                $final_transactions[] = [
                 'name' => $otherUser->first_name . ' ' . $otherUser->last_name,
                 'email' => $otherUser->email,
                 'type' => $type,
                 'transaction_id' => $sendCoins->transaction_id,
                 'date' => $transaction->received,
                 'balance' => $sendCoins->amount,
                 'memo' => $transaction->memo,
                 'pubkey' => $other_user_public
                ];
            }

            if($i == $stateUserTransactionsCount-1 && $decay == true) {
                $state_balance->amount = $su_transaction->balance;
                $state_balance->record_date = $su_transaction->balance_date;
                $final_transactions[] = [
                    'type' => 'decay',
                    'balance' => floatval(intval($su_transaction->balance - $state_balance->decay)),
                    'decay_duration' => $su_transaction->balance_date->timeAgoInWords(),
                    'memo' => ''
                ];
            }
        }
        
        return $final_transactions;
      
    }
    
    public function updateTxHash($transaction, $signatureMapString) 
    {
        $transaction_id = $transaction->id;
        $previousTxHash = null;
        if($transaction_id > 1) {
            try {
                $previousTransaction = $this
                    ->find('all', ['contain' => false])
                    ->select(['tx_hash'])
                    ->where(['id' => $transaction_id - 1])
                    ->first();
          /*$previousTransaction = $transactionsTable->get($this->mTransactionID - 1, [
              'contain' => false, 
              'fields' => ['tx_hash']
          ]);*/
            } catch(Cake\Datasource\Exception\RecordNotFoundException $ex) {
              return ['state' => 'error', 'msg' => 'previous transaction not found', 'details' => $ex->getMessage()];
            }
            if(!$previousTransaction) {
              // shouldn't occur
              return ['state' => 'error', 'msg' => 'previous transaction not found'];
            }
            $previousTxHash = $previousTransaction->tx_hash;
      }
      try {
        //$transactionEntity->received = $transactionsTable->get($transactionEntity->id, ['contain' => false, 'fields' => ['received']])->received;
        $transaction->received = $this
                ->find('all', ['contain' => false])
                ->where(['id' => $transaction->id])
                ->select(['received'])->first()->received;
      } catch(Cake\Datasource\Exception\RecordNotFoundException $ex) {
        return ['state' => 'error', 'msg' => 'current transaction not found in db', 'details' => $ex->getMessage()];
      }
      
      // calculate tx hash
      // previous tx hash + id + received + sigMap as string
      // Sodium use for the generichash function BLAKE2b today (11.11.2019), mabye change in the future
      $state = \Sodium\crypto_generichash_init();
      //echo "prev hash: $previousTxHash\n";
      if($previousTxHash != null) {
        \Sodium\crypto_generichash_update($state, stream_get_contents($previousTxHash));
      }
      //echo "id: " . $transactionEntity->id . "\n";
      \Sodium\crypto_generichash_update($state, strval($transaction->id));
      //echo "received: " . $transactionEntity->received;
      \Sodium\crypto_generichash_update($state, $transaction->received->i18nFormat('yyyy-MM-dd HH:mm:ss'));
      \Sodium\crypto_generichash_update($state, $signatureMapString);
      $transaction->tx_hash = \Sodium\crypto_generichash_final($state);
      if ($this->save($transaction)) {
        return true;
      }
      return ['state' => 'error', 'msg' => 'error by saving transaction', 'details' => $transaction->getErrors()];
    }
    
    /*!
     * @return: false if no decay start block found
     * @return: DateTime Object with start date if one start block found
     * @return: ['state':'error'] if more than one found
     */
    public function getDecayStartDate()
    {
        $transaction = $this->find()->where(['transaction_type_id' => 9])->select(['received'])->order(['received' => 'ASC']);
        if($transaction->count() == 0) {
            return null;
        }
        return $transaction->first()->received;
    }
}
