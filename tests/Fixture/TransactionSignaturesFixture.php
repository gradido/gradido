<?php
namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * TransactionSignaturesFixture
 */
class TransactionSignaturesFixture extends TestFixture
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
        // (1, 1, 0x911b173577261c8b971b4e6ca56b5125ebd5155de8176ce35f9c95ae6929edf3f1e3095d29b37c8bc7cc2478981a41d8cdd3e5398a2c7aa7c691bd486836b705, 0x80183e03535d17a54ff1fd7dbaed86939d423a19a258c26b8e338ce601338355),
        // (2, 2, 0x01e76b14190fa14cb5839d1129b04c4043e691895541b16ae1b54c6b3206d7933def3c58ebf195bc67a7cd5773554636c55fe5e7ddb0c81fb247c24761f8120f, 0x80183e03535d17a54ff1fd7dbaed86939d423a19a258c26b8e338ce601338355),
        // (3, 3, 0x2b8c56cac8993f445a8b41ab6e86a486faa18c1e945df1c0acce2bcb342b96d36c5fcb7e687c97cc89790a386241d4b911e8f7949a2da64eef290c5380fc8602, 0x80183e03535d17a54ff1fd7dbaed86939d423a19a258c26b8e338ce601338355),
        // (4, 4, 0xcb0e9f83b847f630cc6831d62aca8fbfa971af458a12389d7e43abb5bb0936b8e35dbc5b1d641eb2f793e253eb0b149a809860a69897bfe86ba4bfd178da8102, 0xcccb338e003d2abb92178fc4302d1ab83f66b27d9c7e5b6b3ac91e0c23922088);
        $this->records = [
            [
                'id' => 1,
                'transaction_id' => 1,
                'signature' => '0x911b173577261c8b971b4e6ca56b5125ebd5155de8176ce35f9c95ae6929edf3f1e3095d29b37c8bc7cc2478981a41d8cdd3e5398a2c7aa7c691bd486836b705',
                'pubkey' => '0x80183e03535d17a54ff1fd7dbaed86939d423a19a258c26b8e338ce601338355'
            ],
            [
                'id' => 2,
                'transaction_id' => 2,
                'signature' => '0x01e76b14190fa14cb5839d1129b04c4043e691895541b16ae1b54c6b3206d7933def3c58ebf195bc67a7cd5773554636c55fe5e7ddb0c81fb247c24761f8120f',
                'pubkey' => '0x80183e03535d17a54ff1fd7dbaed86939d423a19a258c26b8e338ce601338355'
            ],
            [
                'id' => 3,
                'transaction_id' => 3,
                'signature' => '0x2b8c56cac8993f445a8b41ab6e86a486faa18c1e945df1c0acce2bcb342b96d36c5fcb7e687c97cc89790a386241d4b911e8f7949a2da64eef290c5380fc8602',
                'pubkey' => '0x80183e03535d17a54ff1fd7dbaed86939d423a19a258c26b8e338ce601338355'
            ],
            [
                'id' => 4,
                'transaction_id' => 4,
                'signature' => '0xcb0e9f83b847f630cc6831d62aca8fbfa971af458a12389d7e43abb5bb0936b8e35dbc5b1d641eb2f793e253eb0b149a809860a69897bfe86ba4bfd178da8102',
                'pubkey' => '0xcccb338e003d2abb92178fc4302d1ab83f66b27d9c7e5b6b3ac91e0c23922088'
            ],
        ];
        parent::init();
    }
}
