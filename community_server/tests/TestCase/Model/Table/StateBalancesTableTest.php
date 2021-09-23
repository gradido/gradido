<?php
namespace App\Test\TestCase\Model\Table;

use App\Model\Table\StateBalancesTable;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\StateBalancesTable Test Case
 */
class StateBalancesTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\StateBalancesTable
     */
    public $StateBalancesTable;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.StateBalances',
        'app.StateUsers',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $config = TableRegistry::getTableLocator()->exists('StateBalances') ? [] : ['className' => StateBalancesTable::class];
        $this->StateBalancesTable = TableRegistry::getTableLocator()->get('StateBalances', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->StateBalancesTable);

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
     * Test sortTransactions method
     *
     * @return void
     */
    public function testSortTransactions()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test updateLastStateBalanceOfMonth method
     *
     * @return void
     */
    public function testUpdateLastStateBalanceOfMonth()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test chooseForMonthAndUser method
     *
     * @return void
     */
    public function testChooseForMonthAndUser()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }

    /**
     * Test updateBalanceWithTransaction method
     *
     * @return void
     */
    public function testUpdateBalanceWithTransaction()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
    
}
