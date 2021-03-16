<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * StateErrors Model
 *
 * @property \App\Model\Table\StateUsersTable&\Cake\ORM\Association\BelongsTo $StateUsers
 * @property \App\Model\Table\TransactionTypesTable&\Cake\ORM\Association\BelongsTo $TransactionTypes
 *
 * @method \App\Model\Entity\StateError get($primaryKey, $options = [])
 * @method \App\Model\Entity\StateError newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\StateError[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\StateError|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateError saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateError patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\StateError[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\StateError findOrCreate($search, callable $callback = null, $options = [])
 *
 * @mixin \Cake\ORM\Behavior\TimestampBehavior
 */
class StateErrorsTable extends Table
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

        $this->setTable('state_errors');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->addBehavior('Timestamp');

        $this->belongsTo('StateUsers', [
            'foreignKey' => 'state_user_id',
            'joinType' => 'INNER'
        ]);
        $this->belongsTo('TransactionTypes', [
            'foreignKey' => 'transaction_type_id',
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
            ->scalar('message_json')
            ->requirePresence('message_json', 'create')
            ->notEmptyString('message_json');

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
        $rules->add($rules->existsIn(['transaction_type_id'], 'TransactionTypes'));

        return $rules;
    }
}
