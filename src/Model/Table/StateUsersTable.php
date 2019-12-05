<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * StateUsers Model
 *
 * @property \App\Model\Table\IndicesTable&\Cake\ORM\Association\BelongsTo $Indices
 * @property \App\Model\Table\StateGroupsTable&\Cake\ORM\Association\BelongsTo $StateGroups
 * @property \App\Model\Table\StateBalancesTable&\Cake\ORM\Association\HasMany $StateBalances
 * @property \App\Model\Table\StateCreatedTable&\Cake\ORM\Association\HasMany $StateCreated
 * @property \App\Model\Table\TransactionCreationsTable&\Cake\ORM\Association\HasMany $TransactionCreations
 * @property \App\Model\Table\TransactionSendCoinsTable&\Cake\ORM\Association\HasMany $TransactionSendCoins
 *
 * @method \App\Model\Entity\StateUser get($primaryKey, $options = [])
 * @method \App\Model\Entity\StateUser newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\StateUser[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\StateUser|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateUser saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateUser patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\StateUser[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\StateUser findOrCreate($search, callable $callback = null, $options = [])
 */
class StateUsersTable extends Table
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

        $this->setTable('state_users');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        /*$this->belongsTo('Indices', [
            'foreignKey' => 'index_id',
            'joinType' => 'INNER'
        ]);*/
        $this->belongsTo('StateGroups', [
            'foreignKey' => 'state_group_id',
            'joinType' => 'INNER'
        ]);
        $this->hasMany('StateBalances', [
            'foreignKey' => 'state_user_id'
        ]);
        $this->hasMany('StateCreated', [
            'foreignKey' => 'state_user_id'
        ]);
        $this->hasMany('TransactionCreations', [
            'foreignKey' => 'state_user_id'
        ]);
        $this->hasMany('TransactionSendCoins', [
            'foreignKey' => 'state_user_id'
        ]);
        /*$this->hasMany('TransactionReceiveCoins', [
            'className' => 'TransactionSendCoins',
            'foreignKey' => 'receiver_user_id'
        ]);*/
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
            ->requirePresence('public_key', 'create')
            ->notEmptyString('public_key');

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
       // $rules->add($rules->existsIn(['index_id'], 'Indices'));
        //$rules->add($rules->existsIn(['state_group_id'], 'StateGroups'));

        return $rules;
    }
    
    public function getReceiverProposal() {
      $stateUsers = $this->find('all');
      $receiverProposal = [];
      foreach($stateUsers as $stateUser) {
        $name = $stateUser->email;
        $keyHex = bin2hex(stream_get_contents($stateUser->public_key));
        if($name === NULL) {
          $name = $stateUser->first_name . ' ' . $stateUser->last_name;
        }
        array_push($receiverProposal, ['name' => $name, 'key' => $keyHex]);
        //$stateUser->public_key
      }
      return $receiverProposal;
    }
}
