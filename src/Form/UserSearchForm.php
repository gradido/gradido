<?php 
// in src/Form/ContactForm.php
namespace App\Form;

use Cake\Form\Form;
use Cake\Form\Schema;
use Cake\Validation\Validator;

class UserSearchForm extends Form
{

    protected function _buildSchema(Schema $schema)
    {
        return $schema->addField('search', ['type' => 'string']);
    }

    function validationDefault(Validator $validator)
    {
      $validator->setProvider('custom', 'App\Model\Validation\GenericValidation');
      /*
        $validator->add('receiver_pubkey_hex', 'length', [
                'rule' => ['length', 64],
                'message' => 'a valid pubkey in hex format is required (64 character)'
            ])->add('receiver_pubkey_hex_select', 'length', [
                'rule' => ['length', 64],
                'message' => 'a valid pubkey in hex format is required (64 character)',
            ]);
*/
      // TODO: add validation for used character to prevent hacking attempts
        $validator->add('search', 'length', [
            'rule' => ['maxLength', 50],
            'message' => __('The search text should contain max 50 character')
        ])
        //->alphaNumeric('memo', __('Only Alpha Numeric Character allowed'))
        ->add('search', 'custom', [
            'rule' => 'alphaNumeric',
            'provider' => 'custom',
            //'message' => __('Only Alpha Numeric Character allowed')
            'message' => __('No HTML Tags like < or > please.')
        ]);
        return $validator;
    }
    /*
     * $validator->add('title', 'custom', [
    'rule' => 'customRule',
    'provider' => 'custom',
    'message' => 'The title is not unique enough'
]);
     */

    protected function _execute(array $data)
    {
        // Send an email.
        return true;
    }
}