<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * OperatorTypes Model
 *
 * @property \App\Model\Table\OperatorsTable&\Cake\ORM\Association\HasMany $Operators
 *
 * @method \App\Model\Entity\OperatorType get($primaryKey, $options = [])
 * @method \App\Model\Entity\OperatorType newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\OperatorType[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\OperatorType|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\OperatorType saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\OperatorType patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\OperatorType[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\OperatorType findOrCreate($search, callable $callback = null, $options = [])
 */
class OperatorTypesTable extends Table
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

        $this->setTable('operator_types');
        $this->setDisplayField('name');
        $this->setPrimaryKey('id');

        $this->hasMany('Operators', [
            'foreignKey' => 'operator_type_id'
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
            ->scalar('name')
            ->maxLength('name', 25)
            ->requirePresence('name', 'create')
            ->notEmptyString('name');

        $validator
            ->scalar('text')
            ->maxLength('text', 255)
            ->requirePresence('text', 'create')
            ->notEmptyString('text');

        return $validator;
    }
}
