<?php
namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * TransactionCreationsFixture
 */
class TransactionCreationsFixture extends TestFixture
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
        'amount' => ['type' => 'biginteger', 'length' => 20, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'ident_hash' => ['type' => 'binary', 'length' => 32, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null],
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

      // (1, 1, 2, 10000000, 0x3235303332373635330000000000000000000000000000000000000000000000, '2020-12-01 00:00:00'),
      // (2, 2, 2, 10000000, 0x3235303332373635330000000000000000000000000000000000000000000000, '2021-01-01 00:00:00'),
      // (3, 3, 2, 10000000, 0x3235303332373635330000000000000000000000000000000000000000000000, '2021-02-01 00:00:00');

        $this->records = [
            [
                'id' => 1,
                'transaction_id' => 1,
                'state_user_id' => 1,
                'amount' => 10000000,
                'ident_hash' => hex2bin('3235303332373635330000000000000000000000000000000000000000000000')
            ],
            [
                'id' => 2,
                'transaction_id' => 2,
                'state_user_id' => 1,
                'amount' => 10000000,
                'ident_hash' => hex2bin('3235303332373635330000000000000000000000000000000000000000000000')
            ],
            [
                'id' => 3,
                'transaction_id' => 3,
                'state_user_id' => 1,
                'amount' => 10000000,
                'ident_hash' => hex2bin('3235303332373635330000000000000000000000000000000000000000000000')
            ],
        ];
        parent::init();
    }
}
