<?php
namespace App\Test\TestCase\Controller;

use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;

/**
 * App\Controller\JsonRequestHandlerController Test Case
 *
 * @uses \App\Controller\JsonRequestHandlerController
 */
class JsonRequestHandlerControllerTest extends TestCase
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
    
    public $transactions = [
        'validCreation' => 'CmYKZAog4zad42I86ERtBCTEAT56HXGiZxrj178eeY6_BmXRRfISQDnatUMvitiiP0-sY93JStYPhPKKPU4Vosv_EGrh77BVs48xhPgPj2QHWC3oyuuMh6nN8YNjBQZx20rKvdQ4uwMSRwoMQUdFIE1haSAyMDIxEgYI_c3ChQY6LwolCiD39KSaSsEDefi53ctzHE2exJXm7dFgdfUmcs0l4xefDxDQDxoGCPqbtIQG',
        'validCreation900' => 'CmYKZAog9_SkmkrBA3n4ud3LcxxNnsSV5u3RYHX1JnLNJeMXnw8SQCaZHmvmvJOt336E3qst3rn1pptdAR5ZPzePaUT10x0_Yky8FnEiQtMGNy1yT94QErzwQudJZjJwDY2uyK4cTgkSOxIGCKb1vYUGOjEKJwog4zad42I86ERtBCTEAT56HXGiZxrj178eeY6_BmXRRfIQgNHKCBoGCIDMuf8F',
        'validCreation1200' => 'CmYKZAog9_SkmkrBA3n4ud3LcxxNnsSV5u3RYHX1JnLNJeMXnw8SQF8jptIrosEyVmCf3WEIGVOK0NR8YCcO0j-s8v2yUyR5BKus0ciT6B7IA5LDtn7eQX6zHjg1v5WlsTiZuOpuNgwSRAoHVG8gbXVjaBIGCL3Jv4UGOjEKJwog4zad42I86ERtBCTEAT56HXGiZxrj178eeY6_BmXRRfIQgOy4CxoGCOG5toQG',
        'notBase64' => 'CgpIYWxsbyBXZW-0EgYIyfSG7gV_LwonCiCboKikqwjZfes9xuqgthFH3',
        'validTransfer' => 'CmYKZAog9_SkmkrBA3n4ud3LcxxNnsSV5u3RYHX1JnLNJeMXnw8SQA0ZVQ9T1qBabzmgDO1NAWNy2J6mlv0YjMP99CiV7bSR0zemt5XoM-kTviR1aTqKggzpSYSyTN5T6gIx2xa-hgkSYwoLTXkgQmlydGhkYXkSBgie0L-FBjJMCkoKJgog9_SkmkrBA3n4ud3LcxxNnsSV5u3RYHX1JnLNJeMXnw8QgIl6EiDjNp3jYjzoRG0EJMQBPnodcaJnGuPXvx55jr8GZdFF8g',
        'errornusTransfer' => 'ClxGcm9oZXMgTmV1ZXMgSmFociB1bmQgREFOS0UsIGRhc3MgZHUgZGljaCBzbyBlaW5zZXR6dCBmw7xyIEdyYWRpZG8hIEhlcnpsaWNoZSBHcsO8w59lIFRlcmVzYRIGCPjjgvEFQlAKJgogUQwFYeVlGlfWDrkXNN7rHwejoCDJKt+YkYJfbJVyj3EQwIQ9EiYKIPXIRnUhVJ/zCs5+y/VaTBjTIoYizJNwS+JC//xsbQrHEMCEPQ=='
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
        $this->get('/JsonRequestHandler');
        $this->assertResponseOk();     
        
        $expected = json_encode(['state' => 'error', 'msg' => 'unknown method for get', 'details' => null]);
        $this->assertEquals($expected, (string)$this->_response->getBody());
    }
    
    public function testInvalidJson()
    {
        $this->configRequest([
            'headers' => ['Accept' => 'application/json']
        ]);
        $this->post('/JsonRequestHandler', '{This isn\'t valid json}');
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
              ['transaction' => $this->transactions['validCreation']],
              ['state' => 'error', 'msg' => 'parameter error']
      );
    }
    
    public function testUnknownMethod()
    {
        //$this->post('/TransactionJsonRequestHandler', ['method' => 'putTransaction', 'transaction' => 'CgpIYWxsbyBXZWx0EgYIyfSG7gVKLwonCiCboKikqwjZfes9xuqgthFH3/cHHaWchkUhWiGhQjB23xCg2pMBELWJ7ZYK']);
        $this->postAndParse(
              ['method' => 'foobar', 'transaction' => $this->transactions['validCreation']], 
              ['state' => 'error', 'msg' => 'unknown method for post', 'details' => 'foobar']
      );
      
    }
    
    public function testInvalidEncodedTransaction() {
      //"msg":"error parsing transaction","details":[{"Transaction":"base64 decode error"}]
      $this->postAndParse(
              ['method' => 'putTransaction', 'transaction' => $this->transactions['notBase64']],
              ['state' => 'error', 'msg' => 'error parsing transaction', 'details' => [
                   ['Transaction' => 'invalid base64 string'], 
                   ['base64' => 'CgpIYWxsbyBXZW-0EgYIyfSG7gV_LwonCiCboKikqwjZfes9xuqgthFH3']
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
    
    public function testToLargeCreationSum()
    {

      $this->postAndParse(
                ['method' => 'putTransaction', 'transaction' => $this->transactions['validCreation900']],
                '{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'
        );
    }
    
    public function testToLargeCreation()
    {
      $this->postAndParse(
                ['method' => 'putTransaction', 'transaction' => $this->transactions['validCreation1200']],
                '{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'
        );
    }
    
    public function testValidTransfer()
    {        
        $this->postAndParse(
          ['method' => 'putTransaction', 'transaction' => $this->transactions['validTransfer']],
          ['state' => 'success']      
        );
    }
       
    public function testValidCreation()
    {
      $this->postAndParse(
              ['method' => 'putTransaction', 'transaction' => $this->transactions['validCreation']],
              ['state' => 'success']
        );
    }
    
    private function postAndParse($params, $expected) 
    {
        $this->enableCsrfToken();
        //$this->enableSecurityToken();
        
        //$token = 'my-csrf-token';
        //$this->cookie('csrfToken', $token);

        $this->configRequest([
            'headers' => ['Accept' => 'application/json']//, 'X-CSRF-Token' => $token]
        ]);
        
        $this->disableErrorHandlerMiddleware();
        $this->post('/JsonRequestHandler', json_encode($params));        
        
        // Check that the response was a 200
        $this->assertResponseOk();     
        
        $responseBodyString = (string)$this->_response->getBody();
        $json = json_decode($responseBodyString);
        $this->assertNotFalse($json);
        
        if(is_array($expected)) {
          $expected = json_encode($expected);
        }
        $this->assertEquals($expected, $responseBodyString);
    }
}
