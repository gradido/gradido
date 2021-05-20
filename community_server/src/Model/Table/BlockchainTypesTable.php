<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * BlockchainTypes Model
 *
 * @method \App\Model\Entity\BlockchainType get($primaryKey, $options = [])
 * @method \App\Model\Entity\BlockchainType newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\BlockchainType[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\BlockchainType|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\BlockchainType saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\BlockchainType patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\BlockchainType[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\BlockchainType findOrCreate($search, callable $callback = null, $options = [])
 */
class BlockchainTypesTable extends AppTable
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

        $this->setTable('blockchain_types');
        $this->setDisplayField('name');
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
            ->scalar('name')
            ->maxLength('name', 45)
            ->requirePresence('name', 'create')
            ->notEmptyString('name');

        $validator
            ->scalar('text')
            ->maxLength('text', 255)
            ->allowEmptyString('text');

        $validator
            ->scalar('symbol')
            ->maxLength('symbol', 10)
            ->allowEmptyString('symbol');

        return $validator;
    }
    
    public function fillWithDefault()
    {
        $entry_contents = [
            [
                'id' => 1,
                'name' => 'mysql',
                'text' => 'use mysql db as blockchain, work only with single community-server', 
                'symbol' => NULL
            ],
            [   
                'id' => 2,
                'name' => 'hedera',
                'text' => 'use hedera for transactions', 
                'symbol' => 'HBAR'
            ]
        ];
        $entities = $this->newEntities($entry_contents);
        $this->truncate();
        $save_results = $this->saveManyWithErrors($entities);
        if(!$save_results['success']) {
            $save_results['msg'] = 'error by saving default transaction types';
        }
        return $save_results;

    }
}
