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
    
    public $transactions = [
        'valid' => 'CgpIYWxsbyBXZWx0EgYIyfSG7gVKLwonCiCboKikqwjZfes9xuqgthFH3',
        'notBase64' => 'CgpIYWxsbyBXZW-0EgYIyfSG7gV_LwonCiCboKikqwjZfes9xuqgthFH3'
    ];
    
    /*public function setUp() {
        parent::setUp();
    }
*/
    public function testWrongMethod()
    {
        $this->configRequest([
            'headers' => ['Accept' => 'application/json']
        ]);
        $this->get('/TransactionJsonRequestHandler');
        $this->assertResponseOk();     
        
        $expected = json_encode(['state' => 'error', 'msg' => 'no post']);
        $this->assertEquals($expected, (string)$this->_response->getBody());
    }
    
    public function testInvalidJson()
    {
        $this->configRequest([
            'headers' => ['Accept' => 'application/json']
        ]);
        $this->post('/TransactionJsonRequestHandler', '{This isn\'t valid json}');
        $this->assertResponseOk();     
        
        $expected = json_encode(['state' => 'error', 'msg' => 'parameter error']);
        $this->assertEquals($expected, (string)$this->_response->getBody());
    }
    
    public function testNotSetTransaction() 
    {
      $this->postAndParse(
              ['method' => 'putTransaction'],
              ['state' => 'error', 'msg' => 'parameter error']
      );
    }
    public function testNotSetMethod()
    {
      $this->postAndParse(
              ['transaction' => $this->transactions['valid']],
              ['state' => 'error', 'msg' => 'parameter error']
      );
    }
    
    public function testUnknownMethod()
    {
        //$this->post('/TransactionJsonRequestHandler', ['method' => 'putTransaction', 'transaction' => 'CgpIYWxsbyBXZWx0EgYIyfSG7gVKLwonCiCboKikqwjZfes9xuqgthFH3/cHHaWchkUhWiGhQjB23xCg2pMBELWJ7ZYK']);
      $this->postAndParse(
              ['method' => 'foobar', 'transaction' => $this->transactions['valid']], 
              ['state' => 'error', 'msg' => 'unknown method', 'details' => 'foobar']
      );
      
    }
    
    public function testInvalidEncodedTransaction() {
      //"msg":"error parsing transaction","details":[{"Transaction":"base64 decode error"}]
      $this->postAndParse(
              ['method' => 'putTransaction', 'transaction' => $this->transactions['notBase64']],
              ['state' => 'error', 'msg' => 'error parsing transaction', 'details' => [
                  ['Transaction' => 'base64 decode error']
              ]]
      );
    }
    
    public function testInvalidTransaction() {
      
      $this->postAndParse(
              ['method' => 'putTransaction', 'transaction' => base64_encode('Hallo Miau Welt')],
              ['state' => 'error', 'msg' => 'error parsing transaction', 'details' => [
                  ['Transaction' => 'Error occurred during parsing: Unexpected wire type.']
              ]]
      );
    }
    

    /**
     * Test index method
     *
     * @return void
     */
    public function testIndex()
    {

        $this->postAndParse(
                ['method' => 'putTransaction', 'transaction' => $this->transactions['valid']],
                ['state' => 'success']
        );
    }
    
    private function postAndParse($params, $expected) 
    {
     
        $this->configRequest([
            'headers' => ['Accept' => 'application/json']
        ]);
        
        $this->disableErrorHandlerMiddleware();
        $this->post('/TransactionJsonRequestHandler', json_encode($params));        
        
        // Check that the response was a 200
        $this->assertResponseOk();     
        
        $responseBodyString = (string)$this->_response->getBody();
        $json = json_decode($responseBodyString);
        $this->assertNotFalse($json);
        
        $expected = json_encode($expected);
        $this->assertEquals($expected, $responseBodyString);
    }
}
