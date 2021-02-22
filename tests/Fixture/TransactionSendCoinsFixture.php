<?php
namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * TransactionSendCoinsFixture
 */
class TransactionSendCoinsFixture extends TestFixture
{
    /**
     * Fields
     *
     * @var array
     */
    // @codingStandardsIgnoreStart
    public $fields = [
        'id' => ['type' => 'integer', 'length' => 11, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'transaction_id' => ['type' => 'integer', 'length' => 11, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'state_user_id' => ['type' => 'integer', 'length' => 11, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'receiver_public_key' => ['type' => 'binary', 'length' => 32, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null],
        'receiver_user_id' => ['type' => 'binary', 'length' => 64, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null],
        'amount' => ['type' => 'biginteger', 'length' => 20, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'sender_final_balance' => ['type' => 'biginteger', 'length' => 20, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
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
        // (1, 4, 2, 0x80183e03535d17a54ff1fd7dbaed86939d423a19a258c26b8e338ce601338355, 1, 15000000, 15000000);
        $this->records = [
            [
                'id' => 1,
                'transaction_id' => 4,
                'state_user_id' => 1,
                'receiver_public_key' => '8190bda585ee5f1d9fbf7d06e81e69ec18e13376104cff54b7457eb7d3ef710d',
                'receiver_user_id' => 4,
                'amount' => 15000000,
                'sender_final_balance' => 15000000
            ],
        ];
        parent::init();
    }
}
