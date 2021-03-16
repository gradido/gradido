<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * StateCreated Model
 *
 * @property \App\Model\Table\TransactionsTable&\Cake\ORM\Association\BelongsTo $Transactions
 * @property \App\Model\Table\StateUsersTable&\Cake\ORM\Association\BelongsTo $StateUsers
 *
 * @method \App\Model\Entity\StateCreated get($primaryKey, $options = [])
 * @method \App\Model\Entity\StateCreated newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\StateCreated[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\StateCreated|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateCreated saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateCreated patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\StateCreated[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\StateCreated findOrCreate($search, callable $callback = null, $options = [])
 *
 * @mixin \Cake\ORM\Behavior\TimestampBehavior
 */
class StateCreatedTable extends Table
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

        $this->setTable('state_created');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->addBehavior('Timestamp');

        $this->belongsTo('Transactions', [
            'foreignKey' => 'transaction_id',
            'joinType' => 'INNER'
        ]);
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
            ->requirePresence('month', 'create')
            ->notEmptyString('month');

        $validator
            ->requirePresence('year', 'create')
            ->notEmptyString('year');

        $validator
            ->integer('short_ident_hash')
            ->requirePresence('short_ident_hash', 'create')
            ->notEmptyString('short_ident_hash');

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

        return $rules;
    }
}
