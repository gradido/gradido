<?php

namespace Model\Transactions;

use Cake\ORM\TableRegistry;

class TransactionBase {
    private $errors = [];
    static $stateUsersTable = null;
  
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
    
    public static function getStateUsersTable()
    {
      if(!self::$stateUsersTable) {
        self::$stateUsersTable = TableRegistry::getTableLocator()->get('state_users');
      }
      return self::$stateUsersTable;
    }


    protected function getStateUserId($publicKey) {
      
      $stateUsersTable = self::getStateUsersTable();
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
      $stateUsersTable = self::getStateUsersTable();
      $stateUser = $stateUsersTable->get($id);
      if($stateUser) {
        return $stateUser;
      }
      
      return NULL;
    }


    protected function updateStateBalance($stateUserId, $addAmountCent, $recordDate) {
        $finalBalance = 0;
        $stateBalancesTable = TableRegistry::getTableLocator()->get('stateBalances');
        $stateBalanceQuery = $stateBalancesTable
                ->find('all')
                ->select(['amount', 'id'])
                ->contain(false)
                ->where(['state_user_id' => $stateUserId]);//->first();
        //debug($stateBalanceQuery);
        
        if($stateBalanceQuery->count() > 0) {
          $stateBalanceEntry = $stateBalanceQuery->first();
          //$stateBalanceEntry->amount = $stateBalanceEntry->partDecay($recordDate) + $addAmountCent;;
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
}