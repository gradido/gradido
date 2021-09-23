<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * AdminErrors Model
 *
 * @property \App\Model\Table\StateUsersTable&\Cake\ORM\Association\BelongsTo $StateUsers
 *
 * @method \App\Model\Entity\AdminError get($primaryKey, $options = [])
 * @method \App\Model\Entity\AdminError newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\AdminError[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\AdminError|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\AdminError saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\AdminError patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\AdminError[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\AdminError findOrCreate($search, callable $callback = null, $options = [])
 *
 * @mixin \Cake\ORM\Behavior\TimestampBehavior
 */
class AdminErrorsTable extends Table
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

        $this->setTable('admin_errors');
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
            ->scalar('controller')
            ->maxLength('controller', 255)
            ->requirePresence('controller', 'create')
            ->notEmptyString('controller');

        $validator
            ->scalar('action')
            ->maxLength('action', 255)
            ->requirePresence('action', 'create')
            ->notEmptyString('action');

        $validator
            ->scalar('state')
            ->maxLength('state', 255)
            ->requirePresence('state', 'create')
            ->notEmptyString('state');

        $validator
            ->scalar('msg')
            ->maxLength('msg', 255)
            ->requirePresence('msg', 'create')
            ->notEmptyString('msg');

        $validator
            ->scalar('details')
            ->maxLength('details', 255)
            ->requirePresence('details', 'create')
            ->notEmptyString('details');

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
}
