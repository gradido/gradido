<?php
namespace App\Test\TestCase\Model\Table;

use App\Model\Table\TransactionStatesTable;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\TransactionStatesTable Test Case
 */
class TransactionStatesTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\TransactionStatesTable
     */
    public $TransactionStates;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.TransactionStates',
        'app.Transactions',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $config = TableRegistry::getTableLocator()->exists('TransactionStates') ? [] : ['className' => TransactionStatesTable::class];
        $this->TransactionStates = TableRegistry::getTableLocator()->get('TransactionStates', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->TransactionStates);

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
}
