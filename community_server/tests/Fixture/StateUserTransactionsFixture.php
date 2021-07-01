<?php
namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * StateUserTransactionsFixture
 */
class StateUserTransactionsFixture extends BaseTestFixture
{
    /**
     * Fields
     *
     * @var array
     */
    // @codingStandardsIgnoreStart
    public $fields = [
        'id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => false, 'default' => null, 'comment' => '', 'autoIncrement' => true, 'precision' => null],
        'state_user_id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'transaction_id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'transaction_type_id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'balance' => ['type' => 'biginteger', 'length' => 20, 'unsigned' => false, 'null' => true, 'default' => '0', 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'balance_date' => ['type' => 'timestamp', 'length' => null, 'null' => false, 'default' => 'CURRENT_TIMESTAMP', 'comment' => '', 'precision' => null],
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
        $sql =  [
            [1, 4, 1, 1, 0, '2021-04-09 00:00:00'],
            [2, 1, 2, 1, 0, '2021-04-12 00:00:00'],
            [5, 1, 3, 2, 0, '2021-04-12 00:00:00'],
            [6, 4, 3, 2, 0, '2021-04-12 00:00:00'],
            [7, 1, 4, 2, 0, '2021-04-14 00:00:00'],
            [8, 4, 4, 2, 0, '2021-04-14 00:00:00'],
            [23, 1, 5, 2, 0, '2021-04-14 09:01:07'],
            [24, 4, 5, 2, 0, '2021-04-14 09:01:07'],
            [25, 4, 7, 2, 0, '2021-04-14 09:02:28'],
            [26, 1, 7, 2, 0, '2021-04-14 09:02:28'],
            [27, 4, 8, 2, 0, '2021-04-14 09:28:46'],
            [28, 1, 8, 2, 0, '2021-04-14 09:28:46'],
            [29, 4, 9, 2, 0, '2021-04-14 09:31:28'],
            [30, 1, 9, 2, 0, '2021-04-14 09:31:28']
        ];
        $this->records = $this->sqlEntrysToRecords($sql, $this->fields);
        parent::init();
    }
}
