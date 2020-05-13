<?php
namespace App\Test\TestCase\Model\Table;

use App\Model\Table\StateUsersTable;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\StateUsersTable Test Case
 */
class StateUsersTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\StateUsersTable
     */
    public $StateUsersTable;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.StateUsers',
        'app.StateGroups',
        'app.StateBalances',
        'app.StateCreated',
        'app.TransactionCreations',
        'app.TransactionSendCoins'
    ];

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $config = TableRegistry::getTableLocator()->exists('StateUsers') ? [] : ['className' => StateUsersTable::class];
        $this->StateUsersTable = TableRegistry::getTableLocator()->get('StateUsers', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->StateUsersTable);

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
     * Test getReceiverProposal method
     *
     * @return void
     */
    public function testGetReceiverProposal()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}
