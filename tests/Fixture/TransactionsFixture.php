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
      // (1, NULL, 1, 0x7dc55cf3a1a39b441d87d5452c40cad8e7fd8aab573ed1da0bf118129fc77987, 'AGE Dezember 2020', '2021-02-19 13:18:52'),
      // (2, NULL, 1, 0xdea38d4dd72af1e0d90621ae8139efbbdb3b44b60be04b0d40cfc157afd2c19c, 'AGE Januar 2021', '2021-02-19 13:25:36'),
      // (3, NULL, 1, 0x4e7734ed84dcd8ddc5286b87ff85eb12704092d51f485e7c4dbcb4a68ba296ce, 'AGE Februar 2021', '2021-02-19 13:25:37'),
      // (4, NULL, 2, 0x065b5b75b7f4b156fe2b07b54b1a3df0c4eadc40c0f6940c666fed4d75751f8f, 'Ich teile mit dir\r\n \r\nmiau _=', '2021-02-19 13:27:14');
        $this->records = [
            [
                'id' => 1,
                'group_id' => NULL,
                'transaction_type_id' => 1,
                'tx_hash' => '0x7dc55cf3a1a39b441d87d5452c40cad8e7fd8aab573ed1da0bf118129fc77987',
                'memo' => 'AGE Dezember 2020',
                'received' => '2021-02-19 13:18:52'
            ],
            [
                'id' => 2,
                'group_id' => NULL,
                'transaction_type_id' => 1,
                'tx_hash' => '0xdea38d4dd72af1e0d90621ae8139efbbdb3b44b60be04b0d40cfc157afd2c19c',
                'memo' => 'AGE Januar 2021',
                'received' => '2021-02-19 13:25:36'
            ],
            [
                'id' => 3,
                'group_id' => NULL,
                'transaction_type_id' => 1,
                'tx_hash' => '0x4e7734ed84dcd8ddc5286b87ff85eb12704092d51f485e7c4dbcb4a68ba296ce',
                'memo' => 'AGE Februar 2021',
                'received' => '2021-02-19 13:25:37'
            ],
            [
                'id' => 4,
                'group_id' => NULL,
                'transaction_type_id' => 2,
                'tx_hash' => '0x065b5b75b7f4b156fe2b07b54b1a3df0c4eadc40c0f6940c666fed4d75751f8f',
                'memo' => 'Ich teile mit dir\r\n \r\nmiau _=',
                'received' => '2021-02-19 13:27:14'
            ],
        ];
        parent::init();
    }
}
