<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * Migrations Model
 *
 * @method \App\Model\Entity\Migration get($primaryKey, $options = [])
 * @method \App\Model\Entity\Migration newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\Migration[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\Migration|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\Migration saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\Migration patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\Migration[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\Migration findOrCreate($search, callable $callback = null, $options = [])
 */
class MigrationsTable extends Table
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

        $this->setTable('migrations');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');
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
            ->nonNegativeInteger('id')
            ->allowEmptyString('id', null, 'create');

        $validator
            ->integer('db_version')
            ->allowEmptyString('db_version');

        return $validator;
    }
}
