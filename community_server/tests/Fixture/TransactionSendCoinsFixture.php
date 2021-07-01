<?php
namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * TransactionSendCoinsFixture
 */
class TransactionSendCoinsFixture extends BaseTestFixture
{
    /**
     * Fields
     *
     * @var array
     */
    // @codingStandardsIgnoreStart
    public $fields = [
        'id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => false, 'default' => null, 'comment' => '', 'autoIncrement' => true, 'precision' => null],
        'transaction_id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'sender_public_key' => ['type' => 'binary', 'length' => 32, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null],
        'state_user_id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => true, 'default' => '0', 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'receiver_public_key' => ['type' => 'binary', 'length' => 32, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null],
        'receiver_user_id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => true, 'default' => '0', 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'amount' => ['type' => 'biginteger', 'length' => 20, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'sender_final_balance' => ['type' => 'biginteger', 'length' => 20, 'unsigned' => false, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        '_constraints' => [
            'primary' => ['type' => 'primary', 'columns' => ['id'], 'length' => []],
        ],
        '_options' => [
            'engine' => 'InnoDB',
            'collation' => 'utf8mb4_unicode_ci'
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
        $sql = [
            [2, 3, '0000000000000000000000000000000000000000000000000000000000000000', 1, 'e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2', 4, 1000000, 6254699],
            [3, 4, '0000000000000000000000000000000000000000000000000000000000000000', 1, 'e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2', 4, 100000, 7027197],
            [11, 5, '0000000000000000000000000000000000000000000000000000000000000000', 1, 'e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2', 4, 100000, 6922113],
            [12, 7, '0000000000000000000000000000000000000000000000000000000000000000', 4, 'f7f4a49a4ac10379f8b9ddcb731c4d9ec495e6edd16075f52672cd25e3179f0f', 1, 100000, 9212951],
            [13, 8, '0000000000000000000000000000000000000000000000000000000000000000', 4, 'f7f4a49a4ac10379f8b9ddcb731c4d9ec495e6edd16075f52672cd25e3179f0f', 1, 100000, 9112627],
            [14, 9, '0000000000000000000000000000000000000000000000000000000000000000', 4, 'f7f4a49a4ac10379f8b9ddcb731c4d9ec495e6edd16075f52672cd25e3179f0f', 1, 100000, 8912594]
        ];
        
        $this->records = $this->sqlEntrysToRecords($sql, $this->fields);
        parent::init();
    }
}
