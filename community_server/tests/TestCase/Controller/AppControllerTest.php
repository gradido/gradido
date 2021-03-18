<?php
namespace App\Test\TestCase\Controller;

use App\Controller\AppController;
use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;

/**
 * App\Controller\DashboardController Test Case
 *
 * @uses \App\Controller\DashboardController
 */
class AppControllerTest extends TestCase
{
    use IntegrationTestTrait;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.StateBalances'
    ];
    
    public function setUp() 
    {
        parent::setUp();
        
    }

    /**
     * Test initialize method
     *
     * @return void
     */
    public function testInitialize()
    {
        $this->session(['StateUser.id' => 1]);
        $this->get('/');
        $this->assertSession(1200, 'StateUser.balance');
        //$this->markTestIncomplete('Not implemented yet.');
    }

    
}
