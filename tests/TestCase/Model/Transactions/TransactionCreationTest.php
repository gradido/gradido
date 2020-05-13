<?php
namespace App\Test\TestCase\Controller;

use App\Controller\AppController;
use Cake\TestSuite\IntegrationTestTrait;
use Cake\TestSuite\TestCase;

use Model\Transactions\TransactionCreation;

/**
 * App\Controller\DashboardController Test Case
 *
 * @uses \App\Controller\DashboardController
 */
class TransactionCreationTest extends TestCase
{
    use IntegrationTestTrait;

    /**
     * Fixtures
     *
     * @var array
     */
    public $fixtures = [
        
    ];
    
    public function setUp() 
    {
        parent::setUp();
        
    }

    public function testHashingFunction()
    {
        $pairs = [
            "a" => 97,
            "b" => 98,
            "c" => 99,
            "d" => 100,
            "aa" => 12513,
            "ab" => 12514,
            "@"  => 64,
            ".d" => 5988,
            "gmx" => 1701624,
            "@gmx" => 135919352,
            "@gmx.de" => 3742152099,
            "***REMOVED***" => 2928827813,
            "***REMOVED***" => 1899591683,
            "***REMOVED***" => 2089074830,
            "maximilian.muster@gradido.net" => 793144931,
            "coin-info5@gradido.net" => 1829129963,
            "coin-info6@gradido.net" => 1830178539,
            "coin-info8@gradido.net" => 1832275691,
            "coin-info9@gradido.net" => 1833324267,
            "coin-info10@gradido.net" => 3877298078,
            "coin-info11@gradido.net" => 3878346654,
            "coin-info12@gradido.net" => 3879395230,
            "***REMOVED***" => 2089074830,
            "***REMOVED***" => 3996757473,
            "***REMOVED***" => 3788634614,
            "***REMOVED***" => 807797884,
            "***REMOVED***" => 1640973721,
            "***REMOVED***" => 2025729173,
            "***REMOVED***" => 1961122507,
            "***REMOVED***" => 362466358,
            "***REMOVED***" => 3796728871,
            "***REMOVED***" => 807797884,
            "***REMOVED***" => 3794905967,
            "***REMOVED***" => 3077694284,
            "***REMOVED***" => 3246159770,
            "***REMOVED***" => 3123402690,
            "testneu-11-12-3@gradido.net" => 4092403827,
            "***REMOVED***" => 3151414199,
            "***REMOVED***" => 3526188273,
            "***REMOVED***" => 966804823,
            "***REMOVED***" => 1309273258,
            "***REMOVED***" => 995978784,
            "***REMOVED***" => 310113324,
            "***REMOVED***" => 1309273258,
            "***REMOVED***" => 530108573,
            "***REMOVED***" => 1734855679,
            "***REMOVED***" => 767779182,
            "***REMOVED***" => 2247491519,
            "***REMOVED***" => 3248626267,
            "***REMOVED***" => 3516649930,
            "***REMOVED***" => 231214190,
            "***REMOVED***" => 4247461928,
            "***REMOVED***" => 324829839,
            "***REMOVED***" => 3046147747,
            "***REMOVED***" => 3207307415,
            "***REMOVED***" => 728893500,
            "***REMOVED***" => 3905254663,
            "***REMOVED***" => 3207307415,
            "***REMOVED***" => 1155733239,
            "***REMOVED***" => 2013046423,
            "***REMOVED***" => 4033835283,
            "***REMOVED***" => 1945541625,
            "***REMOVED***" => 2310715309,
            "***REMOVED***" => 1221362064,
            "***REMOVED***" => 4161339877
        ];
        foreach($pairs as $email => $cpp_hash) {
          $php_hash = TransactionCreation::DRMakeStringHash($email);
          // assertEquals(mixed $expected, mixed $actual[, string $message = ''])
          if($php_hash != $cpp_hash) {
            $this->assertEquals($cpp_hash, $php_hash, "hashes for $email don't match");
          }
        }
    }

    
}
