<?php
namespace App\Test\TestCase\Model\Table;

use App\Model\Table\StateUserTransactionsTable;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\StateUserTransactionsTable Test Case
 */
class StateUserTransactionsTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\StateUserTransactionsTable
     */
    public $StateUserTransactions;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.StateUserTransactions',
        'app.StateUsers',
        'app.Transactions',
        'app.TransactionTypes',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $config = TableRegistry::getTableLocator()->exists('StateUserTransactions') ? [] : ['className' => StateUserTransactionsTable::class];
        $this->StateUserTransactions = TableRegistry::getTableLocator()->get('StateUserTransactions', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->StateUserTransactions);

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
}
