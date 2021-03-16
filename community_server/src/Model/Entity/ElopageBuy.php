<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * ElopageBuy Entity
 *
 * @property int $id
 * @property int $elopage_user_id
 * @property int $affiliate_program_id
 * @property int $publisher_id
 * @property int $order_id
 * @property int $product_id
 * @property int $product_price
 * @property string $payer_email
 * @property string $publisher_email
 * @property bool $payed
 * @property \Cake\I18n\FrozenTime $success_date
 * @property string $event
 *
 * @property \App\Model\Entity\ElopageUser $elopage_user
 * @property \App\Model\Entity\AffiliateProgram $affiliate_program
 * @property \App\Model\Entity\Publisher $publisher
 * @property \App\Model\Entity\Order $order
 * @property \App\Model\Entity\Product $product
 */
class ElopageBuy extends Entity
{
    /**
     * Fields that can be mass assigned using newEntity() or patchEntity().
     *
     * Note that when '*' is set to true, this allows all unspecified fields to
     * be mass assigned. For security purposes, it is advised to set '*' to false
     * (or remove it), and explicitly make individual fields accessible as needed.
     *
     * @var array
     */
    protected $_accessible = [
        'elopage_user_id' => true,
        'affiliate_program_id' => true,
        'publisher_id' => true,
        'order_id' => true,
        'product_id' => true,
        'product_price' => true,
        'payer_email' => true,
        'publisher_email' => true,
        'payed' => true,
        'success_date' => true,
        'event' => true,
        'elopage_user' => true,
        'affiliate_program' => true,
        'publisher' => true,
        'order' => true,
        'product' => true,
    ];
}
