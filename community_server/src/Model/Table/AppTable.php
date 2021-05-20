<?php
namespace App\Model\Table;

use Cake\ORM\Table;
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
class AppTable extends Table
{
    
    public function initialize(array $config)
    {
        parent::initialize($config);
    }
    
    public function truncate()
    {
        $truncateCommands = $this->getSchema()->truncateSql($this->getConnection());
        foreach ($truncateCommands as $truncateCommand) {
            $this->getConnection()->query($truncateCommand);
        }
        $this->getConnection()->query('ALTER TABLE ' . $this->getSchema()->name() . ' AUTO_INCREMENT=1');
        return ['success' => true];
    }    
    public function saveManyWithErrors($entities) 
    {
        $save_results = $this->saveMany($entities);
        // save all at once failed, no try one by one to get error message
        if($save_results === false) {
            foreach($entities as $entity) {
                if(!$this->save($entity)) {
                    return ['success' => false, 'errors' => $entity->getErrors()];
                }
            }
        } else {
            return ['success' => true];
        }
    }
}
