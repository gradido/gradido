<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * StateUserRoles Model
 *
 * @property \App\Model\Table\StateUsersTable&\Cake\ORM\Association\BelongsTo $StateUser
 * @property \App\Model\Table\RolesTable&\Cake\ORM\Association\BelongsTo $Roles
 *
 * @method \App\Model\Entity\StateUserRole get($primaryKey, $options = [])
 * @method \App\Model\Entity\StateUserRole newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\StateUserRole[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\StateUserRole|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateUserRole saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\StateUserRole patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\StateUserRole[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\StateUserRole findOrCreate($search, callable $callback = null, $options = [])
 */
class StateUserRolesTable extends Table
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

        $this->setTable('state_user_roles');
        $this->setPrimaryKey('id');

      
        $this->belongsTo('StateUser', [
            'foreignKey' => 'state_user_id',
            'joinType' => 'INNER'
        ]);

        $this->belongsTo('Role', [
            'foreignKey' => 'role_id',
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
    
    
}
