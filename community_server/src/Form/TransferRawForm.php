<?php 
// in src/Form/ContactForm.php
namespace App\Form;

use Cake\Form\Form;
use Cake\Form\Schema;
use Cake\Validation\Validator;

class TransferRawForm extends Form
{

    protected function _buildSchema(Schema $schema)
    {
        return $schema
            ->addField('sender_privkey_hex', ['type' => 'string'])
            ->addField('sender_pubkey_hex', ['type' => 'string'])
            ->addField('receiver_pubkey_hex', ['type' => 'string'])
            ->addField('amount', ['type' => 'decimal', 'precision' => 2])
            ->addField('memo', ['type' =>'text', 'default' => '', 'rows' => 3, 'maxlength' => 150]);
    }

    function validationDefault(Validator $validator)
    {
      $validator->setProvider('custom', 'App\Model\Validation\TransactionValidation');
      
      $validator
      ->add('memo', 'length', [
          'rule' => ['maxLength', 150],
          'message' => __('The memo should contain max 150 character')
      ])
      ->add('memo', 'custom', [
          'rule' => 'alphaNumeric',
          'provider' => 'custom',
          //'message' => __('Only Alpha Numeric Character allowed')
          'message' => __('No HTML Tags like &gt; or &lt; please.')
      ])
      ->allowEmptyString('memo', null, 'create')
      ->add('receiver_pubkey_hex', 'custom', [
          'rule' => 'hexKey64',
          'provider' => 'custom',
          'message' => 'a valid pubkey in hex format is required (64 character)'
      ])
      ->add('sender_privkey_hex', 'custom', [
          'rule' => 'hexKey128',
          'provider' => 'custom',
          'message' => 'a valid privkey in hex format is required (128 character)'
      ])
      ->add('sender_pubkey_hex', 'custom', [
          'rule' => 'hexKey64',
          'provider' => 'custom',
          'message' => 'a valid pubkey in hex format is required (64 character)'
      ])
      ->add('amount', 'custom', [
          'rule' => 'amount',
          'provider' => 'custom', 
          'message' => __('Please give a valid positive number with maximal 2 decimal places')
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