<?php
namespace App\Test\TestCase\Model\Table;

use App\Model\Table\AddressTypesTable;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\AddressTypesTable Test Case
 */
class AddressTypesTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\AddressTypesTable
     */
    public $AddressTypes;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.AddressTypes',
        'app.StateGroupAddresses',
        'app.TransactionGroupAddaddress',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $config = TableRegistry::getTableLocator()->exists('AddressTypes') ? [] : ['className' => AddressTypesTable::class];
        $this->AddressTypes = TableRegistry::getTableLocator()->get('AddressTypes', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->AddressTypes);

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
