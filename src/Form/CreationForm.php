<?php 
// in src/Form/ContactForm.php
namespace App\Form;

use Cake\Form\Form;
use Cake\Form\Schema;
use Cake\Validation\Validator;

class CreationForm extends Form
{

    protected function _buildSchema(Schema $schema)
    {
        return $schema
            //->addField('receiver_pubkey_hex', ['type' => 'string'])
            ->addField('receiver', ['type' => 'select'])
            ->addField('amount', ['type' => 'decimal', 'precision' => 2])
            ->addField('memo', ['type' =>'string', 'default' => '']);
    }

    function validationDefault(Validator $validator)
    {
      $validator->setProvider('custom', 'App\Model\Validation\TransactionValidation');
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
        $validator->add('memo', 'length', [
            'rule' => ['maxLength', 150],
            'message' => 'max 150 character'
        ])
        //->alphaNumeric('memo', __('Only Alpha Numeric Character allowed'))
        ->add('memo', 'custom', [
            'rule' => 'alphaNumeric',
            'provider' => 'custom',
            'message' => __('Only Alpha Numeric Character allowed')
        ])
        ->allowEmptyString('memo', null, 'create')
        /*->add('receiver_pubkey_hex', 'custom', [
            'rule' => 'hexKey64',
            'provider' => 'custom',
            'message' => 'a valid pubkey in hex format is required (64 character)'
        ])
        ->allowEmptyString('receiver_pubkey_hex', null, 'create')*/
        ->add('amount', 'custom', [
            'rule' => 'amount',
            'provider' => 'custom', 
            'message' => __('Please give a valid number with maximal 2 decimal places')
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