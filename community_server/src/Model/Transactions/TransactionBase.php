<?php

namespace Model\Transactions;

use Cake\ORM\TableRegistry;

class TransactionBase {
    private $errors = [];
    private $warnings = [];
    static $tables = [];
  
    public function getErrors() {
        return $this->errors;
    }
    public function clearErrors() {
      $this->errors = [];
    }
    
    public function getWarnings() {
        return $this->warnings;
    }
    public function addError($functionName, $errorName) {
        array_push($this->errors, [$functionName => $errorName]);
    }
    public function addWarning($functionName, $warningName) {
        array_push($this->warnings, [$functionName => $warningName]);
    }
    
    public function addErrors($errors) {
        $this->errors = array_merge($this->errors, $errors);
    }
    
    public function addWarnings($warnings) {
        $this->warnings = array_merge($this->warnings, $warnings);
    }
  
    public function hasErrors() {
        return count($this->errors) > 0;
    }
    
    public function hasWarnings() {
        return count($this->warnings) > 0;
    }
    public static function getTable($tableName) {
        if(!isset(self::$tables[$tableName])) {
          self::$tables[$tableName] = TableRegistry::getTableLocator()->get($tableName);
        }
        return self::$tables[$tableName];
    }


    protected function getStateUserId($publicKey) {
      
      $stateUsersTable = self::getTable('state_users');
      $stateUser = $stateUsersTable->find('all')->select(['id'])->where(['public_key' => $publicKey])->first();
      if($stateUser) {
        return $stateUser->id;
      }
      // create new entry
      $stateUserEntity = $stateUsersTable->newEntity();
      $stateUserEntity->public_key = $publicKey;
      if($stateUsersTable->save($stateUserEntity)) {
        return $stateUserEntity->id;
      } else {
        $this->addError('TransactionBase::getStateUserId', 'error saving new state user with error: ' . json_encode($stateUserEntity->getErrors()));
      }
      
      return NULL;
    }
    
    protected function getStateUser($id) {
      $stateUsersTable = self::getTable('state_users');
      $stateUser = $stateUsersTable->get($id);
      if($stateUser) {
        return $stateUser;
      }
      
      return NULL;
    }
    
    protected function getStateUserFromPublickey($publicKey) {
        $stateUsersTable = self::getTable('state_users');
        $stateUser = $stateUsersTable->find('all')->where(['public_key' => $publicKey])->first();
        if($stateUser) {
          return $stateUser;
        }
      
      return NULL;
    }


    protected function updateStateBalance($stateUserId, $addAmountCent, $recordDate) {
        $stateBalancesTable = self::getTable('stateBalances');
        $stateBalanceQuery = $stateBalancesTable
                ->find('all')
                ->select(['amount', 'id', 'record_date'])
                ->contain(false)
                ->where(['state_user_id' => $stateUserId]);//->first();
        //debug($stateBalanceQuery);
        
        if($stateBalanceQuery->count() > 0) {
          
          $stateBalanceEntry = $stateBalanceQuery->first();
          $stateBalanceEntry->amount =
                  $stateBalancesTable->calculateDecay($stateBalanceEntry->amount, $stateBalanceEntry->record_date, $recordDate)
                  + $addAmountCent;
        } else {
          $stateBalanceEntry = $stateBalancesTable->newEntity();
          $stateBalanceEntry->state_user_id = $stateUserId;
          $stateBalanceEntry->amount = $addAmountCent;
        }
        $stateBalanceEntry->record_date = $recordDate;
        $finalBalance = $stateBalanceEntry->amount;
        
        if(!$stateBalancesTable->save($stateBalanceEntry)) {
          $errors = $stateBalanceEntry->getErrors();
          $this->addError('TransactionBase::updateStateBalance', 'error saving state balance with: ' . json_encode($errors));
          return false;
        }
        if(!$finalBalance) {
          return true;
          //$this->addError('TransactionBase::updateStateBalance', 'final balance is zero')
        }
        return $finalBalance;
    }
    
    protected function addStateUserTransaction($stateUserId, $transactionId, $transactionTypeId, $balance, $balance_date) {
        $stateUserTransactionTable = self::getTable('state_user_transactions');
        
        $stateUserTransactions = $stateUserTransactionTable
                                    ->find('all')
                                    ->where(['state_user_id' => $stateUserId])
                                    ->order(['transaction_id DESC']);
        $new_balance = $balance;
        if($stateUserTransactions->count() > 0) {
            $stateBalanceTable = self::getTable('state_balances');
            $state_user_transaction = $stateUserTransactions->first();
            if(!$state_user_transaction) {
                $this->addError('TransactionBase::addStateUserTransaction', 'state_user_transaction is zero, no first entry exist?');
                return false;
            }
            $new_balance += $stateBalanceTable->calculateDecay(
                    $state_user_transaction->balance, 
                    $state_user_transaction->balance_date, 
                    $balance_date
            );
        }
        $entity = $stateUserTransactionTable->newEntity();
        $entity->state_user_id = $stateUserId;
        $entity->transaction_id = $transactionId;
        $entity->transaction_type_id =  $transactionTypeId;
        $entity->balance = $new_balance;
        $entity->balance_date = $balance_date;
        
        if(!$stateUserTransactionTable->save($entity)) {
            $errors = $entity->getErrors();
            $this->addError('TransactionBase::addStateUserTransaction', 'error saving state user balance with: ' . json_encode($errors));
            return false;
        }
        // set balance from all state_user_transactions which came after (sorted by balance_date) to 0 
        // because creation transaction can be added before other transaction which already happend
        $state_user_transactions = $stateUserTransactionTable
                                    ->find()
                                    ->select(['id', 'balance'])
                                    ->where(['state_user_id' => $stateUserId, 'balance_date >' => $balance_date])
                                    ;
        foreach($state_user_transactions as $t) {
            $t->balance = 0;
        }
        $stateUserTransactionTable->saveMany($state_user_transactions);
        return true;
    }
}