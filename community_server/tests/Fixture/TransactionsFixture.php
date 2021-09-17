<?php
namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * TransactionsFixture
 */
class TransactionsFixture extends BaseTestFixture
{
    /**
     * Fields
     *
     * @var array
     */
    // @codingStandardsIgnoreStart
    public $fields = [
        'id' => ['type' => 'biginteger', 'length' => 20, 'unsigned' => true, 'null' => false, 'default' => null, 'comment' => '', 'autoIncrement' => true, 'precision' => null],
        'state_group_id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => true, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'transaction_type_id' => ['type' => 'integer', 'length' => 10, 'unsigned' => true, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null, 'autoIncrement' => null],
        'tx_hash' => ['type' => 'binary', 'length' => 48, 'null' => true, 'default' => null, 'comment' => '', 'precision' => null],
        'memo' => ['type' => 'string', 'length' => 255, 'null' => false, 'default' => null, 'collate' => 'utf8mb4_unicode_ci', 'comment' => '', 'precision' => null, 'fixed' => null],
        'received' => ['type' => 'timestamp', 'length' => null, 'null' => false, 'default' => 'CURRENT_TIMESTAMP', 'comment' => '', 'precision' => null],
        'blockchain_type_id' => ['type' => 'biginteger', 'length' => 20, 'unsigned' => true, 'null' => false, 'default' => '1', 'comment' => '', 'precision' => null, 'autoIncrement' => null],
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
            [1, NULL, 1, '15f242a7bb92a7db82678e0baf5ec1734c038ac0dc7b19e6d1ebbcf92a6cf3ad00000000000000000000000000000000', 'AGE Januar 2021', '2021-04-09 00:00:00', 1],
            [2, NULL, 1, 'f932eca7686802d1697773fea713a3c6a3e3dace8b5aa552dd8503d50ce349f500000000000000000000000000000000', 'AGE Januar 2021', '2021-04-12 00:00:00', 1],
            [3, NULL, 2, '4e2235f208edaf5cbb285955732022a625cf1e100eb629c56896d2fbfb8b34e800000000000000000000000000000000', 'test', '2021-04-12 00:00:00', 1],
            [4, NULL, 2, 'fc6e69696beb7c56ad7c511fc3999f954411427bec810184b70c092911deae1900000000000000000000000000000000', 'test time', '2021-04-14 00:00:00', 1],
            [5, NULL, 2, 'a7149ebc0d6cd8c061906dafe05e13689b51642a41100d0ec7bb6cd2dcafdc1800000000000000000000000000000000', 'test time', '2021-04-14 09:01:07', 1],
            [6, NULL, 9, '', '', '2021-04-14 09:02:00', 1],
            [7, NULL, 2, '2e3c3ab3e42c06f2ecb12f61c970712467d8ad9ddfa16fa58dd76492e5924b7d00000000000000000000000000000000', 'test time 3', '2021-04-14 09:02:28', 1],
            [8, NULL, 2, 'c2c6354d77ff371daeee25fce9c947748b53d3d6b8398a92bd681923cfd2057100000000000000000000000000000000', 'test login crash', '2021-04-14 09:28:46', 1],
            [9, NULL, 2, '5a8cbf1aaac06b00b2951ff39983cb2ca9a1e6710d72c8e5067278dc679a823100000000000000000000000000000000', 'test login crash', '2021-04-14 09:31:28', 1]
        ];
        $this->records = $this->sqlEntrysToRecords($sql, $this->fields);
        parent::init();
    }
}
