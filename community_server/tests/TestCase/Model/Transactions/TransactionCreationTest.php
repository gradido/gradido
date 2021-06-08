<?php
namespace App\Test\TestCase\Controller;

use App\Controller\AppController;
use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;

use Model\Transactions\TransactionCreation;

/**
 * App\Controller\DashboardController Test Case
 *
 * @uses \App\Controller\DashboardController
 */
class TransactionCreationTest extends TestCase
{
    use IntegrationTestTrait;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        
    ];
    
    public function setUp() 
    {
        parent::setUp();
        
    }
    public function testDummy()
    {
        $this->assertEquals(true, true);
    }

   

    
}
