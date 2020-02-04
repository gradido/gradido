<?php
namespace App\Test\TestCase\Controller\Component;

use App\Controller\Component\JsonRequestClientComponent;
use Cake\Controller\ComponentRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Controller\Component\JsonRequestClientComponent Test Case
 */
class JsonRequestClientComponentTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Controller\Component\JsonRequestClientComponent
     */
    public $JsonRequestClientComponent;

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $registry = new ComponentRegistry();
        $this->JsonRequestClientComponent = new JsonRequestClientComponent($registry);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->JsonRequestClientComponent);

        parent::tearDown();
    }

    /**
     * Test sendTransaction method
     *
     * @return void
     */
    public function testSendTransaction()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test getLoginServerUrl method
     *
     * @return void
     */
    public function testGetLoginServerUrl()
    {
        //$this->markTestIncomplete('Not implemented yet.');
      $serverUrl = $this->JsonRequestClientComponent->getLoginServerUrl();
      $this->assertEquals($serverUrl, 'http://***REMOVED***');
    }

    /**
     * Test is_base64 method
     *
     * @return void
     */
    public function testIsBase64Valid()
    {
        $result = $this->JsonRequestClientComponent->is_base64('CgpIYWxsbyBXZWx0EgYIr6fe7wVKLwonCiDWDyYU4+zldTQdQMIzGpsL20W+vV44JuNVA5hwczIELRDgg5sBELmhkoIE');
        
        $this->assertEquals($result, true);
    }
    
    public function testIsBase64Invalid() 
    {
      $result = $this->JsonRequestClientComponent->is_base64('CgpIYWxsbyBXZWx0EgYIr6fe7wVKLwonCiDWDyYU4-zldTQdQMIzGpsL20W+vV44JuNVA5hwczIELRDgg5sBELmhkoIE');
        
      $this->assertEquals($result, false);
    }
}
