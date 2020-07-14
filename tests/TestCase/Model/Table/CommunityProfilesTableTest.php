<?php
namespace App\Test\TestCase\Model\Table;

use App\Model\Table\CommunityProfilesTable;
use Cake\ORM\TableRegistry;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\CommunityProfilesTable Test Case
 */
class CommunityProfilesTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\CommunityProfilesTable
     */
    public $CommunityProfiles;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        'app.CommunityProfiles',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $config = TableRegistry::getTableLocator()->exists('CommunityProfiles') ? [] : ['className' => CommunityProfilesTable::class];
        $this->CommunityProfiles = TableRegistry::getTableLocator()->get('CommunityProfiles', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->CommunityProfiles);

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
