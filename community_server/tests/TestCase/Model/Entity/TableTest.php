<?php
namespace App\Test\TestCase\Model\Entity;

use App\Model\Entity\Table;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Entity\Table Test Case
 */
class TableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Entity\Table
     */
    public $Table;

    /**
     * setUp method
     *
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
        $this->Table = new Table();
    }

    /**
     * tearDown method
     *
     * @return void
     */
    public function tearDown()
    {
        unset($this->Table);

        parent::tearDown();
    }

    /**
     * Test initial setup
     *
     * @return void
     */
    public function testInitialization()
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}
