<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * Operators Model
 *
 * @property &\Cake\ORM\Association\BelongsTo $OperatorTypes
 *
 * @method \App\Model\Entity\Operator get($primaryKey, $options = [])
 * @method \App\Model\Entity\Operator newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\Operator[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\Operator|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\Operator saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\Operator patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\Operator[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\Operator findOrCreate($search, callable $callback = null, $options = [])
 */
class OperatorsTable extends Table
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

        $this->setTable('operators');
        $this->setDisplayField('name');
        $this->setPrimaryKey('id');

        $this->belongsTo('OperatorTypes', [
            'foreignKey' => 'operator_type_id',
            'joinType' => 'INNER'
        ]);
        
        $this->addBehavior('Timestamp');
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
            ->scalar('username')
            ->maxLength('username', 50)
            ->requirePresence('username', 'create')
            ->notEmptyString('username');
            //->add('usernamePasswordHash', 'unique', ['rule' => 'validateUnique', 'provider' => 'table']);

        $validator
            ->requirePresence('user_pubkey', 'create')
            ->notEmptyString('user_pubkey');
        
        $validator
            ->scalar('data_base64')
            ->maxLength('data_base64', 255)
            ->requirePresence('data_base64', 'create')
            ->notEmptyString('data_base64');

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
        //$rules->add($rules->isUnique(['usernamePasswordHash']));
        $rules->add($rules->existsIn(['operator_type_id'], 'OperatorTypes'));

        return $rules;
    }
}
