<?php
namespace App\Test\TestCase\Controller\Component;

use App\Controller\Component\GradidoNumberComponent;
use Cake\Controller\ComponentRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Controller\Component\NumberComponent Test Case
 */
class GradidoNumberComponentTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Controller\Component\NumberComponent
     */
    public $GradidoNumberComponent;

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $registry = new ComponentRegistry();
        $this->GradidoNumberComponent = new GradidoNumberComponent($registry);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->GradidoNumberComponent);

        parent::tearDown();
    }

    /**
     * Test parseInputNumberToCentNumber method
     *
     * @return void
     */
   /* public function testParseInputNumberToCentNumber()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }*/
    
    public function test100() 
    {
        $result = $this->GradidoNumberComponent->parseInputNumberToCentNumber(100);
        $this->assertEquals(1000000, $result);
    }
    
    public function test1000()
    {
        $result = $this->GradidoNumberComponent->parseInputNumberToCentNumber(1000);
        $this->assertEquals(10000000, $result);
    }
    
    public function test100Comma()
    {
        $result = $this->GradidoNumberComponent->parseInputNumberToCentNumber('100,12');
        $this->assertEquals(1001200, $result);
    }
    
    public function test100Point()
    {
        $result = $this->GradidoNumberComponent->parseInputNumberToCentNumber('100.12');
        $this->assertEquals(1001200, $result);
    }
    
    public function test100Decimal()
    {
        $result = $this->GradidoNumberComponent->parseInputNumberToCentNumber(100.12);
        $this->assertEquals(1001200, $result);
    }
    
    public function test1000Point()
    {
        $result = $this->GradidoNumberComponent->parseInputNumberToCentNumber('1000.12');
        $this->assertEquals(10001200, $result);
    }
    
     public function test1000Comma()
    {
        $result = $this->GradidoNumberComponent->parseInputNumberToCentNumber('1000,12');
        $this->assertEquals(10001200, $result);
    }
}
