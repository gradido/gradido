<?php
namespace App\Test\TestCase\Controller;

use App\Controller\JsonRequestHandlerController;
use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;

/**
 * App\Controller\TransactionJsonRequestHandlerController Test Case
 *
 * @uses \App\Controller\TransactionJsonRequestHandlerController
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
        'app.StateErrors',
        'app.TransactionSignatures',
        'app.TransactionSendCoins',
        'app.StateBalances',
        'app.TransactionTypes'
    ];
    
    public $transactions = [
        'validCreation' => 'GmYKZAogYbkjwhjLY6ZKjGLzhgEhKDuVd_N00KMVkLoCzcKRKZkSQJ8wF12eZo3hcMAlAKKJ9WLT-zuSkNmGh7D98UEqH4KoIysnCkXqEya9EBZl9o11_nJ8xmm_nOevuVjR-GfLMQ8qSQoOSGFsbG8gV2VsdCAxMjMSBgiZm4ruBUovCicKIJSuE1uTzZ8zdStOVcQZA6P6oTp1u5C_1BHqHUoaXnEfEKDakwEQtYntlgo',
        'validCreation900' => 'GmYKZAogYbkjwhjLY6ZKjGLzhgEhKDuVd_N00KMVkLoCzcKRKZkSQNVZ8Ae3Zbg3G0wZ840fzKan6N4KtTcSe0KYi17kQwFmsl18oFxXv8_s6j1xXFrIKjy1_1Olq0a7xYLErDMkjwYqORIGCNb5iu4FSi8KJwoglK4TW5PNnzN1K05VxBkDo_qhOnW7kL_UEeodShpecR8QgNHKCBC1ie2WCg',
        'validCreation1200' => 'GmYKZAogYbkjwhjLY6ZKjGLzhgEhKDuVd_N00KMVkLoCzcKRKZkSQEEey5QMAdldoOTP_jTETHgOQriGsixEY0cziQeRfT_J5YtbI_A6AizEYD-JcxmRmXzv1xjjTgsV39Y32ta2CQkqORIGCIeGi-4FSi8KJwoglK4TW5PNnzN1K05VxBkDo_qhOnW7kL_UEeodShpecR8QgOy4CxC1ie2WCg',
        'notBase64' => 'CgpIYWxsbyBXZW-0EgYIyfSG7gV_LwonCiCboKikqwjZfes9xuqgthFH3',
        'validTransfer' => 'GmYKZAoggZC9pYXuXx2fv30G6B5p7BjhM3YQTP9Ut0V-t9PvcQ0SQDddHyKzAX3LBV0PuDiPc6lxkUipss5tyuLRpMtFJQnT30tsbYIkA1FXimjMKOoiuLswf4OLLV3bAIYehW-b9AgqYQoFSGFsbG8SBgiJlaPvBUJQCiYKIIGQvaWF7l8dn799BugeaewY4TN2EEz_VLdFfrfT73ENEICfSRImCiDtdleSLxhUgEbMW9DpqIwsykFj3-z_enKEOuGnXrmW8xCAn0k',
        'errornusTransfer' => 'ClxGcm9oZXMgTmV1ZXMgSmFociB1bmQgREFOS0UsIGRhc3MgZHUgZGljaCBzbyBlaW5zZXR6dCBmw7xyIEdyYWRpZG8hIEhlcnpsaWNoZSBHcsO8w59lIFRlcmVzYRIGCPjjgvEFQlAKJgogUQwFYeVlGlfWDrkXNN7rHwejoCDJKt+YkYJfbJVyj3EQwIQ9EiYKIPXIRnUhVJ/zCs5+y/VaTBjTIoYizJNwS+JC//xsbQrHEMCEPQ==',
        'creationValid' => 'GmYKZAogLtKKHPXhFtg2FUBrxXcVIiHC93SlZW9moOdUD3V21xsSQHpXYAGiVmSfhjB3o7OPx0ZJuPXrDk5eu1_AOhQBODU3KpUqBRA9yMX54S_mvGijGubCNRcMLcm7wiYbyAG-3AkqSwoQZWluIE1vbmF0c2dlaGFsdBIGCKqs5vEFSi8KJwoggZC9pYXuXx2fv30G6B5p7BjhM3YQTP9Ut0V-t9PvcQ0QgNrECRDKyd3uAQ'
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
        
        $expected = json_encode(['state' => 'error', 'msg' => 'no post']);
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
              ['state' => 'error', 'msg' => 'unknown method', 'details' => 'foobar']
      );
      
    }
    
    public function testInvalidEncodedTransaction() {
      //"msg":"error parsing transaction","details":[{"Transaction":"base64 decode error"}]
      $this->postAndParse(
              ['method' => 'putTransaction', 'transaction' => $this->transactions['notBase64']],
              ['state' => 'error', 'msg' => 'error parsing transaction', 'details' => [
                  ['Transaction' => 'invalid base64 string']
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
                '{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1000 gr per Month not allowed"}]}'
        );
    }
    
    public function testToLargeCreation()
    {
      $this->postAndParse(
                ['method' => 'putTransaction', 'transaction' => $this->transactions['validCreation1200']],
                '{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1000 gr per Month not allowed"}]}'
        );
    }
    
    public function testValidTransfer()
    {
      $this->postAndParse(
        ['method' => 'putTransaction', 'transaction' => $this->transactions['validTransfer']],
        ['state' => 'success']      
      );
    }
    
    /*public function testMissingPreviousTransaction() 
    {
      
    }*/
    
    public function testValidTransaction() 
    {
      $this->postAndParse(
                ['method' => 'putTransaction', 'transaction' => $this->transactions['validCreation']],
                ['state' => 'success']
        );
    }
    
    public function testValidCreation()
    {
      $this->postAndParse(
              ['method' => 'putTransaction', 'transaction' => $this->transactions['creationValid']],
              ['state' => 'success']
        );
    }
    
    private function postAndParse($params, $expected) 
    {
     
        $this->configRequest([
            'headers' => ['Accept' => 'application/json']
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
