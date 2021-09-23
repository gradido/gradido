<?php
namespace App\Test\TestCase\Model\Table;

use App\Model\Table\AdminErrorsTable;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\AdminErrorsTable Test Case
 */
class AdminErrorsTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\AdminErrorsTable
     */
    public $AdminErrors;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.AdminErrors',
        'app.StateUsers'
    ];

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $config = TableRegistry::getTableLocator()->exists('AdminErrors') ? [] : ['className' => AdminErrorsTable::class];
        $this->AdminErrors = TableRegistry::getTableLocator()->get('AdminErrors', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->AdminErrors);

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
