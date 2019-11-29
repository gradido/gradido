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
<<<<<<< HEAD
        'id' => ['type' => 'integer', 'length' => 11, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
=======
        'id' => ['type' => 'integer', 'length' => 11, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'autoIncrement' => true, 'precision' => null],
>>>>>>> cd32fbe27a5e24b63a58d9b0b47c11917d31bcbc
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

      //(8, 17, 11, 1210000, 0x2d31333636313339343833000000000000000000000000000000000000000000)

        $this->records = [
            [
                'id' => 1,
                'transaction_id' => 1,
                'state_user_id' => 11,
                'amount' => 10000000,
                'ident_hash' => hex2bin('2d31333636313339343833000000000000000000000000000000000000000000')
            ],
            [
                'id' => 8,
                'transaction_id' => 17,
                'state_user_id' => 11,
                'amount' => 1210000,
                'ident_hash' => hex2bin('2d31333636313339343833000000000000000000000000000000000000000000')
            ],
        ];
        parent::init();
    }
}
