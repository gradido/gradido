<?php
namespace App\Test\TestCase\Controller;

use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;

/**
 * App\Controller\TransactionJsonRequestHandlerController Test Case
 *
 * @uses \App\Controller\TransactionJsonRequestHandlerController
 */
class AppRequestControllerTest extends TestCase
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
        'app.TransactionTypes',
        'app.Migrations'
    ];
    
    
    
    /*public function setUp() {
        parent::setUp();
    }
*/
    /**
     * Test ajaxGetBalance method
     *
     * @return void
     */
    public function testGetBalance1()
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
        
        $response = $this->getAndParseWithoutCompare('/api/get-balance/' . $session_id);
        $this->assertEquals('success', $response->state);
        $this->assertEquals(9100000, $response->balance);
        $this->assertLessThan(9100000, $response->decay);
        
    }
    
    public function testGetBalance2()
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

        $response = $this->getAndParseWithoutCompare('/api/get-balance/' . $session_id);
        $this->assertEquals('success', $response->state);
        $this->assertEquals(0, $response->balance);
    }
    public function testGetBalance3()
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

        $response = $this->getAndParseWithoutCompare('/api/get-balance/' . $session_id);
        $this->assertEquals('success', $response->state);
        $this->assertEquals(10900000, $response->balance);
        $this->assertLessThan(10900000, $response->decay);
    }
    
    public function testGetBalanceInvalidSession()
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
   
        $this->getAndParse('/api/get-balance/' . 1211, 
                ['state' => 'not found', 'msg' => 'invalid session']
        );
    }
    
    public function testGetBalanceInvalidSessionId()
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
        
        $this->getAndParse('/api/get-balance/' , 
                ['state' => 'not found', 'msg' => 'invalid session']
        );
    }

    /**
     * Test ajaxListTransactions method
     *
     * @return void
     */
    public function testListTransactions()
    {
        //ajaxListTransactions
        $session_id = rand();
        $this->session([
            'session_id' => $session_id,
            'Transactions' => ['pending' => 0, 'executing' => 0],
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
        $expectedResult = '{
	"state": "success",
	"transactions": [
		{
			"name": "Gradido Akademie",
			"type": "creation",
			"transaction_id": 2,
			"date": "2021-04-12T00:00:00+00:00",
			"target_date": "2021-01-01T00:00:00+00:00",
			"creation_amount": 10000000,
			"balance": 10000000,
			"memo": "AGE Januar 2021"
		},
		{
			"name": "Samuel Schmied",
			"email": "test3.yahoo.com",
			"type": "send",
			"transaction_id": 3,
			"date": "2021-04-12T00:00:00+00:00",
			"balance": 1000000,
			"memo": "test",
			"pubkey": "e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2"
		},
		{
			"name": "Samuel Schmied",
			"email": "test3.yahoo.com",
			"type": "send",
			"transaction_id": 4,
			"date": "2021-04-14T00:00:00+00:00",
			"balance": 100000,
			"memo": "test time",
			"pubkey": "e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2"
		},
		{
			"name": "Samuel Schmied",
			"email": "test3.yahoo.com",
			"type": "send",
			"transaction_id": 5,
			"date": "2021-04-14T09:01:07+00:00",
			"balance": 100000,
			"memo": "test time",
			"pubkey": "e3369de3623ce8446d0424c4013e7a1d71a2671ae3d7bf1e798ebf0665d145f2"
		},
		{
			"name": "Samuel Schmied",
			"email": "test3.yahoo.com",
			"type": "receive",
			"transaction_id": 6,
			"date": "2021-04-14T09:02:28+00:00",
			"balance": 100000,
			"memo": "test time 3",
			"pubkey": "0000000000000000000000000000000000000000000000000000000000000000"
		},
		{
			"name": "Samuel Schmied",
			"email": "test3.yahoo.com",
			"type": "receive",
			"transaction_id": 7,
			"date": "2021-04-14T09:28:46+00:00",
			"balance": 100000,
			"memo": "test login crash",
			"pubkey": "0000000000000000000000000000000000000000000000000000000000000000"
		},
		{
			"name": "Samuel Schmied",
			"email": "test3.yahoo.com",
			"type": "receive",
			"transaction_id": 8,
			"date": "2021-04-14T09:31:28+00:00",
			"balance": 100000,
			"memo": "test login crash",
			"pubkey": "0000000000000000000000000000000000000000000000000000000000000000"
		}
	],
	"transactionExecutingCount": 0,
	"count": 7,
	"gdtSum": 180000,
	"timeUsed": 0.5575470924377441,
	"decay_date": "2021-05-28T09:35:02+00:00",
	"balance": 9100000,
	"decay": 9100000
}';
        $this->getAndParse('/api/list-transactions/', json_decode($expectedResult, true));
    }
    
    
    private function getAndParse($path, $expected)
    {
        $this->configRequest([
            'headers' => ['Accept' => 'application/json']
        ]);
        
        $this->disableErrorHandlerMiddleware();
        $this->get($path);        
        
        // Check that the response was in 2xx - 3xx
        $this->assertResponseSuccess();     
        $json = (object)$this->viewVariable('body');
        
        if(!$json) {
            // Check that the response was a 200
            $this->assertResponseOk();     

            $responseBodyString = (string)$this->_response->getBody();
            $json = json_decode($responseBodyString);
            $this->assertNotFalse($json);
        } else {
            $responseBodyString = json_encode($json);
        }

        if(is_array($expected)) {
            $dynamic_fields = ['timeUsed', 'decay_date', 'decay', 'gdtSum'];
            // copy timeUsed because this value will be variy always
            foreach($dynamic_fields as $field) {
                if(isset($expected[$field]) && isset($json->$field)) {
                    $expected[$field] = $json->$field;
                }
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
        
        // Check that the response was in 2xx - 3xx
        $this->assertResponseSuccess();     
        $view_body = $this->viewVariable('body');
        if($view_body) {
            return (object)$view_body;
        }
        // Check that the response was a 200
        $this->assertResponseOk();     
        $responseBodyString = (string)$this->_response->getBody();
        $json = json_decode($responseBodyString, true);
        $this->assertNotFalse($json);

        return $json;
    }
}
