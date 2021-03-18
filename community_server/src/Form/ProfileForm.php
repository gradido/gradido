<?php
// in src/Form/ProfileForm.php
namespace App\Form;

use Cake\Form\Form;
use Cake\Form\Schema;
use Cake\Validation\Validator;

class ProfileForm extends Form
{

    protected function _buildSchema(Schema $schema)
    {
        return $schema
            ->addField('first_name', ['type' => 'string'])
            ->addField('last_name', ['type' => 'string'])
            ->addField('profile_img', ['type' => 'string'])
            ->addField('profile_desc', ['type' =>'text', 'default' => '', 'rows' => 10, 'maxlength' => 2000]);
    }

    function validationDefault(Validator $validator)
    {
        $validator->setProvider('generic', 'App\Model\Validation\GenericValidation');
        $validator->add('first_name', 'length', [
            'rule' => ['maxLength', 255],
            'message' => __('The first name should contain max 255 characters')
        ])
        ->add('last_name', 'length', [
            'rule' => ['maxLength', 255],
            'message' => __('The last name should contain max 255 characters')
        ])
        ->add('profile_desc', 'length', [
            'rule' => ['maxLength', 2000],
            'message' => __('The description should contain max 2000 characters')
        ])
        ->add('profile_desc', 'generic', [
            'rule' => 'alphaNumeric',
            'provider' => 'generic',
            'message' => __('No HTML Tags like &gt; or &lt; please.')
        ])
        ->allowEmptyString('profile_img', null, 'create')
        ->allowEmptyString('profile_desc', null, 'create')
        ;
        return $validator;
    }

    protected function _execute(array $data)
    {
        // Send an email. (??? xxx)
        return true;
    }
}
