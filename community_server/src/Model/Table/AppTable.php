<?php
namespace App\Model\Table;
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
        $truncateCommands = $this->schema()->truncateSql($this->connection());
        foreach ($truncateCommands as $truncateCommand) {
            $this->connection()->query($truncateCommand);
        }
    }    
}
