<?php
namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * CommunityProfiles Model
 *
 * @property &\Cake\ORM\Association\BelongsTo $StateUsers
 *
 * @method \App\Model\Entity\CommunityProfile get($primaryKey, $options = [])
 * @method \App\Model\Entity\CommunityProfile newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\CommunityProfile[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\CommunityProfile|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\CommunityProfile saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\CommunityProfile patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\CommunityProfile[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\CommunityProfile findOrCreate($search, callable $callback = null, $options = [])
 */
class CommunityProfilesTable extends Table
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

        $this->setTable('community_profiles');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');

        $this->belongsTo('StateUsers', [
            'foreignKey' => 'state_user_id',
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
            ->allowEmptyFile('profile_img');

        $validator
            ->scalar('profile_desc')
            ->maxLength('profile_desc', 2000)
            ->allowEmptyFile('profile_desc');

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
