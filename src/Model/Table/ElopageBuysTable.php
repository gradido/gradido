<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * ElopageBuys Model
 *
 * @property \App\Model\Table\ElopageUsersTable&\Cake\ORM\Association\BelongsTo $ElopageUsers
 * @property \App\Model\Table\AffiliateProgramsTable&\Cake\ORM\Association\BelongsTo $AffiliatePrograms
 * @property \App\Model\Table\PublishersTable&\Cake\ORM\Association\BelongsTo $Publishers
 * @property \App\Model\Table\OrdersTable&\Cake\ORM\Association\BelongsTo $Orders
 * @property \App\Model\Table\ProductsTable&\Cake\ORM\Association\BelongsTo $Products
 *
 * @method \App\Model\Entity\ElopageBuy get($primaryKey, $options = [])
 * @method \App\Model\Entity\ElopageBuy newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\ElopageBuy[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\ElopageBuy|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\ElopageBuy saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\ElopageBuy patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\ElopageBuy[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\ElopageBuy findOrCreate($search, callable $callback = null, $options = [])
 */
class ElopageBuysTable extends Table
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

        $this->setTable('elopage_buys');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->belongsTo('ElopageUsers', [
            'foreignKey' => 'elopage_user_id',
            'joinType' => 'INNER',
        ]);
        $this->belongsTo('AffiliatePrograms', [
            'foreignKey' => 'affiliate_program_id',
            'joinType' => 'INNER',
        ]);
        $this->belongsTo('Publishers', [
            'foreignKey' => 'publisher_id',
            'joinType' => 'INNER',
        ]);
        $this->belongsTo('Orders', [
            'foreignKey' => 'order_id',
            'joinType' => 'INNER',
        ]);
        $this->belongsTo('Products', [
            'foreignKey' => 'product_id',
            'joinType' => 'INNER',
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
            ->integer('product_price')
            ->requirePresence('product_price', 'create')
            ->notEmptyString('product_price');

        $validator
            ->scalar('payer_email')
            ->maxLength('payer_email', 255)
            ->requirePresence('payer_email', 'create')
            ->notEmptyString('payer_email');

        $validator
            ->scalar('publisher_email')
            ->maxLength('publisher_email', 255)
            ->requirePresence('publisher_email', 'create')
            ->notEmptyString('publisher_email');

        $validator
            ->boolean('payed')
            ->requirePresence('payed', 'create')
            ->notEmptyString('payed');

        $validator
            ->dateTime('success_date')
            ->requirePresence('success_date', 'create')
            ->notEmptyDateTime('success_date');

        $validator
            ->scalar('event')
            ->maxLength('event', 255)
            ->requirePresence('event', 'create')
            ->notEmptyString('event');

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
        $rules->add($rules->existsIn(['elopage_user_id'], 'ElopageUsers'));
        $rules->add($rules->existsIn(['affiliate_program_id'], 'AffiliatePrograms'));
        $rules->add($rules->existsIn(['publisher_id'], 'Publishers'));
        $rules->add($rules->existsIn(['order_id'], 'Orders'));
        $rules->add($rules->existsIn(['product_id'], 'Products'));

        return $rules;
    }

    /**
     * Returns the database connection name to use by default.
     *
     * @return string
     */
    public static function defaultConnectionName()
    {
        return 'loginServer';
    }
}
