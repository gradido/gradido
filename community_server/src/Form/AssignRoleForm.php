<?php 
// in src/Form/AssignRoleForm.php
namespace App\Form;

use Cake\Form\Form;
use Cake\Form\Schema;
use Cake\Validation\Validator;

class AssignRoleForm extends Form
{

    protected function _buildSchema(Schema $schema)
    {
        return $schema->addField('role_id', ['type' => 'string']);
    }

    function validationDefault(Validator $validator)
    {
      $validator->setProvider('custom', 'App\Model\Validation\GenericValidation');
    
        return $validator;
    }
   

    protected function _execute(array $data)
    {
        // Send an email.
        return true;
    }
}