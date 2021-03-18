<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * TransactionSignatures Model
 *
 * @property \App\Model\Table\TransactionsTable&\Cake\ORM\Association\BelongsTo $Transactions
 *
 * @method \App\Model\Entity\TransactionSignature get($primaryKey, $options = [])
 * @method \App\Model\Entity\TransactionSignature newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\TransactionSignature[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\TransactionSignature|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionSignature saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\TransactionSignature patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionSignature[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\TransactionSignature findOrCreate($search, callable $callback = null, $options = [])
 */
class TransactionSignaturesTable extends Table
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

        $this->setTable('transaction_signatures');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->belongsTo('Transactions', [
            'foreignKey' => 'transaction_id',
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
            ->requirePresence('signature', 'create')
            ->notEmptyString('signature');

        $validator
            ->requirePresence('pubkey', 'create')
            ->notEmptyString('pubkey');

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

        return $rules;
    }
}
