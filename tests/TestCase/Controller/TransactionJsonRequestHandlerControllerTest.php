<?php
namespace App\Test\TestCase\Controller;

use App\Controller\TransactionJsonRequestHandlerController;
use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;

/**
 * App\Controller\TransactionJsonRequestHandlerController Test Case
 *
 * @uses \App\Controller\TransactionJsonRequestHandlerController
 */
class TransactionJsonRequestHandlerControllerTest extends TestCase
{
    use IntegrationTestTrait;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.TransactionCreations',
        'app.Transactions',
        'app.StateUsers',
        'app.TransactionSignatures',
        'app.TransactionSendCoins',
        'app.StateBalances',
        'app.TransactionTypes'
    ];

    /**
     * Test initialize method
     *
     * @return void
     */
    public function testInitialize()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test index method
     *
     * @return void
     */
    public function testIndex()
    {
        //$this->markTestIncomplete('Not implemented yet.');
        $this->post('/TransactionJsonRequestHandler', ['method' => 'putTransaction', 'transaction' => 'CgpIYWxsbyBXZWx0EgYIyfSG7gVKLwonCiCboKikqwjZfes9xuqgthFH3/cHHaWchkUhWiGhQjB23xCg2pMBELWJ7ZYK']);
    }
}
