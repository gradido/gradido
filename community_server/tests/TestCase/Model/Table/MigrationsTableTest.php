<?php
namespace App\Test\TestCase\Model\Table;

use App\Model\Table\MigrationsTable;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\MigrationsTable Test Case
 */
class MigrationsTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\MigrationsTable
     */
    public $Migrations;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.Migrations',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $config = TableRegistry::getTableLocator()->exists('Migrations') ? [] : ['className' => MigrationsTable::class];
        $this->Migrations = TableRegistry::getTableLocator()->get('Migrations', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->Migrations);

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
