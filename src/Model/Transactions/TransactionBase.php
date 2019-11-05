<<<<<<< HEAD
<?php

namespace Model\Transactions;

use Cake\ORM\TableRegistry;

class TransactionBase {
    private $errors = [];
  
    public function getErrors() {
      return errors;
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
    
    protected function getStateUserId($publicKey) {
      $stateUsersTable = TableRegistry::getTableLocator()->get('state_users');
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
=======
<?php

namespace Model\Transactions;

class TransactionBase {
  
>>>>>>> bcb8f1761e3eb94f89e9d2c4e70ab096e528e6c6
}