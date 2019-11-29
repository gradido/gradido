<?php
namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * TransactionsFixture
 */
class TransactionsFixture extends TestFixture
{
    /**
     * Fields
     *
     * @var array
     */
    // @codingStandardsIgnoreStart
    public $fields = [
        'id' => ['type' => 'biginteger', 'length' => 20, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'state_group_id' => ['type' => 'integer', 'length' => 11, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'transaction_type_id' => ['type' => 'integer', 'length' => 11, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'tx_hash' => ['type' => 'binary', 'length' => 32, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null],
        'received' => ['type' => 'timestamp', 'length' => null, 'null' => false, 'default' => 'CURRENT_TIMESTAMP', 'comment' => '', 'precision' => null],
        '_constraints' => [
            'primary' => ['type' => 'primary', 'columns' => ['id'], 'length' => []],
        ],
        '_options' => [
            'engine' => 'InnoDB',
            'collation' => 'utf8_bin'
        ],
    ];
    // @codingStandardsIgnoreEnd
    /**
     * Init method
     *
     * @return void
     */
    public function init()
    {
      //(17, 0, 1, 0x0000000000000000000000000000000000000000000000000000000000000000, '', '2019-11-05 15:13:27');
        $this->records = [
            [
                'id' => 1,
                'group_id' => 0,
                'transaction_type_id' => 1,
                'tx_hash' => '0x0000000000000000000000000000000000000000000000000000000000000000',
                'memo' => '',
                'received' => 1571314633
            ],
            [
                'id' => 17,
                'group_id' => 0,
                'transaction_type_id' => 1,
                'tx_hash' => '0x0000000000000000000000000000000000000000000000000000000000000000',
                'memo' => '',
                'received' => 1572966807
            ],
        ];
        parent::init();
    }
}
