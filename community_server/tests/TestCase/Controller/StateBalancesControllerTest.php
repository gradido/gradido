<?php
namespace App\Test\TestCase\Controller;

use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;
use Cake\ORM\TableRegistry;
use Cake\I18n\Time;


/**
 * App\Controller\StateBalancesController Test Case
 *
 * @uses \App\Controller\StateBalancesController
 */
class StateBalancesControllerTest extends TestCase
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
        'app.StateUserTransactions',
        'app.StateErrors',
        'app.TransactionSignatures',
        'app.TransactionSendCoins',
        'app.StateBalances',
        'app.TransactionTypes'
    ];
    
    public function setUp()
    {
        parent::setUp();
        $this->StateBalances = TableRegistry::getTableLocator()->get('StateBalances');
    }

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
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test overview method
     *
     * @return void
     */
    public function testOverview()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test ajaxGetBalance method
     *
     * @return void
     */
    public function testAjaxGetBalance1()
    {
        $session_id = rand();
        $this->session([
            'session_id' => $session_id,
            'Transaction' => ['pending' => 0, 'executing' => 0],
            'StateUser' => [
                'id' => 1,
                'email_checked' => 1,
                'public_hex' => 'f7f4a49a4ac10379f8b9ddcb731c4d9ec495e6edd16075f52672cd25e3179f0f'
            ]
        ]);
        
        $response = $this->getAndParseWithoutCompare('/state-balances/ajaxGetBalance/' . $session_id);

        $this->assertEquals('success', $response->state);
        $this->assertEquals(7321825, $response->balance);
        $this->assertLessThan(7321825, $response->decay);
        
    }
    
    public function testAjaxGetBalance2()
    {
        $session_id = rand();
        $this->session([
            'session_id' => $session_id,
            'Transaction' => ['pending' => 0, 'executing' => 0],
            'StateUser' => [
                'id' => 3,
                'email_checked' => 1,
                'public_hex' => '131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6'
            ]
        ]);

        $response = $this->getAndParseWithoutCompare('/state-balances/ajaxGetBalance/' . $session_id);
        $this->assertEquals('success', $response->state);
        $this->assertEquals(0, $response->balance);
    }
    public function testAjaxGetBalance3()
    {
        $session_id = rand();
        $this->session([
            'session_id' => $session_id,
            'Transaction' => ['pending' => 0, 'executing' => 0],
            'StateUser' => [
                'id' => 4,
                'email_checked' => 1,
                'public_hex' => 'e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2'
            ]
        ]);

        $response = $this->getAndParseWithoutCompare('/state-balances/ajaxGetBalance/' . $session_id);
        $this->assertEquals('success', $response->state);
        $this->assertEquals(9112592, $response->balance);
        $this->assertLessThan(9112592, $response->decay);
    }
    
    public function testAjaxGetBalanceInvalidSession()
    {
        $session_id = rand();
        $this->session([
            'session_id' => $session_id,
            'Transaction' => ['pending' => 0, 'executing' => 0],
            'StateUser' => [
                'email_checked' => 1,
                'public_hex' => '8190bda585ee5f1d9fbf7d06e81e69ec18e13376104cff54b7457eb7d3ef710d'
            ]
        ]);
        //echo "balance: $balance";
        $this->getAndParse('/state-balances/ajaxGetBalance/' . 1211, 
                ['state' => 'not found', 'msg' => 'invalid session']
        );
    }
    
    public function testAjaxGetBalanceInvalidSessionId()
    {
        $session_id = rand();
        $this->session([
            'session_id' => $session_id,
            'Transaction' => ['pending' => 0, 'executing' => 0],
            'StateUser' => [
                'email_checked' => 1,
                'public_hex' => '8190bda585ee5f1d9fbf7d06e81e69ec18e13376104cff54b7457eb7d3ef710d'
            ]
        ]);
        //echo "balance: $balance";
        $this->getAndParse('/state-balances/ajaxGetBalance' , 
                ['state' => 'error', 'msg' => 'invalid session id']
        );
    }

    /**
     * Test ajaxListTransactions method
     *
     * @return void
     */
    public function testAjaxListTransactions()
    {
        //ajaxListTransactions
        $session_id = rand();
        $this->session([
            'session_id' => $session_id,
            'Transaction' => ['pending' => 0, 'executing' => 0],
            'StateUser' => [
                'id' => 1,
                'first_name' => 'Dario',
                'last_name' => 'Frodo',
                'email_checked' => 1,
                'email' => 'fördertest@gradido.org',
                'public_hex' => '94ae135b93cd9f33752b4e55c41903a3faa13a75bb90bfd411ea1d4a1a5e711f'
            ]
        ]);
        //echo "balance: $balance";
        $this->getAndParse('/state-balances/ajaxListTransactions/' . $session_id, 
                [
                    'state' => 'success', 'transactions' => [[
                        'name' => 'Dario Frodo',
                        'email'=> 'dariofrodo@gmx.de',
                        'type'=> '',
                        'transaction_id' => 4,
                        'date' => '2021-02-19T13:27:14+00:00',
                        'balance' => 150000001,
                        'memo' => ''
                    ]],
                    'transactionExecutingCount' => 0,
                    'count' => 1,
                    'gdtSum' => 0,
                    'timeUsed' => 0.03168010711669922
                ]
        );
    }

    /**
     * Test overviewGdt method
     *
     * @return void
     */
    public function testOverviewGdt()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test sortTransactions method
     *
     * @return void
     */
    public function testSortTransactions()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test view method
     *
     * @return void
     */
    public function testView()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test add method
     *
     * @return void
     */
    public function testAdd()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test edit method
     *
     * @return void
     */
    public function testEdit()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test delete method
     *
     * @return void
     */
    public function testDelete()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
    
    
    private function getAndParse($path, $expected)
    {
        $this->configRequest([
            'headers' => ['Accept' => 'application/json']
        ]);
        
        $this->disableErrorHandlerMiddleware();
        $this->get($path);        
        
        // Check that the response was a 200
        $this->assertResponseOk();     
        
        $responseBodyString = (string)$this->_response->getBody();
        $json = json_decode($responseBodyString);
        $this->assertNotFalse($json);

        if(is_array($expected)) {
            // copy timeUsed because this value will be variy always
          if(isset($expected['timeUsed']) && isset($json->timeUsed)) {
              $expected['timeUsed'] = $json->timeUsed;
          }
          $expected = json_encode($expected);
        }
        
        $this->assertEquals($expected, $responseBodyString);
    }
    private function getAndParseWithoutCompare($path) 
    {
        $this->configRequest([
            'headers' => ['Accept' => 'application/json']
        ]);
        
        $this->disableErrorHandlerMiddleware();
        $this->get($path);        
        
        // Check that the response was a 200
        $this->assertResponseOk();     
        
        $responseBodyString = (string)$this->_response->getBody();
        $json = json_decode($responseBodyString);
        $this->assertNotFalse($json);

        return $json;
    }
}
