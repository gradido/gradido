<?php
namespace App\Test\TestCase\Model\Table;

use App\Model\Table\ElopageBuysTable;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\ElopageBuysTable Test Case
 */
class ElopageBuysTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\ElopageBuysTable
     */
    public $ElopageBuys;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.ElopageBuys',
        'app.ElopageUsers',
        'app.AffiliatePrograms',
        'app.Publishers',
        'app.Orders',
        'app.Products',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $config = TableRegistry::getTableLocator()->exists('ElopageBuys') ? [] : ['className' => ElopageBuysTable::class];
        $this->ElopageBuys = TableRegistry::getTableLocator()->get('ElopageBuys', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->ElopageBuys);

        parent::tearDown();
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
     * Test validationDefault method
     *
     * @return void
     */
    public function testValidationDefault()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test buildRules method
     *
     * @return void
     */
    public function testBuildRules()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test defaultConnectionName method
     *
     * @return void
     */
    public function testDefaultConnectionName()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}
