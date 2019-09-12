<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * AddressTypes Model
 *
 * @property \App\Model\Table\StateGroupAddressesTable&\Cake\ORM\Association\HasMany $StateGroupAddresses
 * @property \App\Model\Table\TransactionGroupAddaddressTable&\Cake\ORM\Association\HasMany $TransactionGroupAddaddress
 *
 * @method \App\Model\Entity\AddressType get($primaryKey, $options = [])
 * @method \App\Model\Entity\AddressType newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\AddressType[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\AddressType|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\AddressType saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\AddressType patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\AddressType[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\AddressType findOrCreate($search, callable $callback = null, $options = [])
 */
class AddressTypesTable extends Table
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

        $this->setTable('address_types');
        $this->setDisplayField('name');
        $this->setPrimaryKey('id');

        $this->hasMany('StateGroupAddresses', [
            'foreignKey' => 'address_type_id'
        ]);
        $this->hasMany('TransactionGroupAddaddress', [
            'foreignKey' => 'address_type_id'
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
            ->allowEmptyString('text');

        return $validator;
    }
}
