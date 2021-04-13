<?php

namespace Model\Transactions;

use Cake\ORM\TableRegistry;

class TransactionBase {
    private $errors = [];
    static $tables = [];
  
    public function getErrors() {
      return $this->errors;
    }

    public function addError($functionName, $errorName) {
      array_push($this->errors, [$functionName => $errorName]);
    }
    
    public function addErrors($errors) {
      $this->errors = array_merge($this->errors, $errors);
    }
  
    public function hasErrors() {
       return count($this->errors) > 0;
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


    protected function updateStateBalance($stateUserId, $addAmountCent, $recordDate) {
        $finalBalance = 0;
        $stateBalancesTable = self::getTable('stateBalances');
        $stateBalanceQuery = $stateBalancesTable
                ->find('all')
                ->select(['amount', 'id', 'record_date'])
                ->contain(false)
                ->where(['state_user_id' => $stateUserId]);//->first();
        //debug($stateBalanceQuery);
        
        if($stateBalanceQuery->count() > 0) {
          $stateBalanceEntry = $stateBalanceQuery->first();
          //$stateBalanceEntry->amount = $stateBalanceEntry->partDecay($recordDate) + $addAmountCent;
          $stateBalanceEntry->amount += $addAmountCent;
        } else {
          $stateBalanceEntry = $stateBalancesTable->newEntity();
          $stateBalanceEntry->state_user_id = $stateUserId;
          $stateBalanceEntry->amount = $addAmountCent;
        }
        $stateBalanceEntry->record_date = $recordDate;
        $finalBalance = $stateBalanceEntry->amount;
        //echo "\ntry to save: "; var_dump($stateBalanceEntry); echo "\n";
        if(!$stateBalancesTable->save($stateBalanceEntry)) {
          $errors = $stateBalanceEntry->getErrors();
          $this->addError('TransactionBase::updateStateBalance', 'error saving state balance with: ' . json_encode($errors));
          return false;
        }
        return $finalBalance;
    }
    
    protected function addStateUserTransaction($stateUserId, $transactionId, $transactionTypeId, $balance) {
        $stateUserTransactionTable = self::getTable('state_user_transactions');
        $stateUserTransactions = $stateUserTransactionTable
                                    ->find('all')
                                    ->where(['state_user_id' => $stateUserId])
                                    ->order(['transaction_id DESC']);
        
        if($stateUserTransactions->count() > 0) {
            $stateBalanceTable = self::getTable('state_balances');
            $state_user_transaction = $stateUserTransactions->first();
            if(!$state_user_transaction) {
                $this->addError('TransactionBase::addStateUserTransaction', 'state_user_transaction is zero, no first entry exist?');
                return false;
            }
            $balance_entity = $stateBalanceTable->newEntity();
            $balance_entity->amount = $state_user_transaction->balance;
            $balance_entity->record_date = $state_user_transaction->balance_date;
            $balance = $balance_entity->decay + $balance;
        }
        $entity = $stateUserTransactionTable->newEntity();
        $entity->state_user_id = $stateUserId;
        $entity->transaction_id = $transactionId;
        $entity->transaction_type_id =  $transactionTypeId;
        $entity->balance = $balance;
        
        if(!$stateUserTransactionTable->save($entity)) {
            $errors = $entity->getErrors();
            $this->addError('TransactionBase::addStateUserTransaction', 'error saving state user balance with: ' . json_encode($errors));
            return false;
        }
        return true;
    }
}