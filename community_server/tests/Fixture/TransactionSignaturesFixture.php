<?php
namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * TransactionSignaturesFixture
 */
class TransactionSignaturesFixture extends BaseTestFixture
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
        'signature' => ['type' => 'binary', 'length' => 64, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null],
        'pubkey' => ['type' => 'binary', 'length' => 32, 'null' => false, 'default' => null, 'comment' => '', 'precision' => null],
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
        $sql = [
            [1, 1, '1c5357f9438f700a5378abadd0dbd74d90e335c6b9691bb9e126520813f3218573b19226382efb89aa8444a9ca98c2e8933463335baac37baf2f4eecd990600a', 'f7f4a49a4ac10379f8b9ddcb731c4d9ec495e6edd16075f52672cd25e3179f0f'],
            [2, 2, '5215376ae7fb989993e3466961636519d4ade77b3bde066149ade028ad54a1a88ca8a206fcf09f52839ae0ed37b99df08ec9af12f3f37197979a206489e3ff0f', 'e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2'],
            [3, 3, 'c70f124feaaea02194d22a5f597963ed3e430343122a0952877854766fe37a709f92b39510de2aae494ef11abe743cd59f08f971b1e0e36f4c333990453d8b0d', 'f7f4a49a4ac10379f8b9ddcb731c4d9ec495e6edd16075f52672cd25e3179f0f'],
            [4, 4, 'a65b39e51ab6191c51d5629bbcefd30f85f801efbb14e1c635c519e97abe217a248820fa1fc6aef56227c9d888c1919bc92471d5d7ae3522c9c50fba9f0d8402', 'f7f4a49a4ac10379f8b9ddcb731c4d9ec495e6edd16075f52672cd25e3179f0f'],
            [5, 5, 'a65b39e51ab6191c51d5629bbcefd30f85f801efbb14e1c635c519e97abe217a248820fa1fc6aef56227c9d888c1919bc92471d5d7ae3522c9c50fba9f0d8402', 'f7f4a49a4ac10379f8b9ddcb731c4d9ec495e6edd16075f52672cd25e3179f0f'],
            [6, 7, 'c233726674bff9bfb8ccb98bf358c6bc701825d971ece915d3c3a3de98886d1d13ee2f773cd9fc4ccbe543ac17be0d780ebead23a0dbf4ec814f7bae2efb9c0e', 'e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2'],
            [7, 8, '83ab780535883ec53ee76d0f68db0e1596418c9e100c806a4d4655d4dedf589d54a6319a2795dabab301e212b52f0dafb2725b7583447f19e47cb417d188a107', 'e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2'],
            [8, 9, '83ab780535883ec53ee76d0f68db0e1596418c9e100c806a4d4655d4dedf589d54a6319a2795dabab301e212b52f0dafb2725b7583447f19e47cb417d188a107', 'e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2']
        ];
        $this->records = $this->sqlEntrysToRecords($sql, $this->fields);
        parent::init();
    }
}
