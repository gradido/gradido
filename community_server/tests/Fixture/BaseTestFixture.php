<?php

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

class BaseTestFixture extends TestFixture
{
    // after copy from sql export, replace all hex values to hex strings with regExp (z.B. within Netbeans)
    // 0x([0-9a-f]*) => '$1'
    protected function sqlEntrysToRecords($sql_entries, $fields) {
        $field_array_keys = array_keys($fields);
        $records = [];
        foreach($sql_entries as $sql_entry) {
            $record = [];
            foreach($sql_entry as $i => $value) {
                $field = $field_array_keys[$i];
                if($fields[$field]['type'] == 'binary') {
                    if(is_string($value)) {
                        $record[$field] = hex2bin($value);
                    }   
                } else {
                    $record[$field] = $value;
                }
            }
            $records[] = $record;
        }
        return $records;
    }
}