<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;
use Cake\I18n\Time;

/**
 * StateBalance Entity
 *
 * @property int $id
 * @property int $state_user_id
 * @property \Cake\I18n\FrozenTime $modified
 * @property int $amount
 *
 * @property \App\Model\Entity\StateUser $state_user
 */
class StateBalance extends Entity
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
        'state_user_id' => true,
        'modified' => true,
        'record_date' => true,
        'amount' => true,
        'record_date' => true,
        'state_user' => true
    ];
    
    protected $_virtual = ['decay'];
    
    private function convertToTimestamp($dateOrTime)
    {
        if(method_exists($dateOrTime, 'getTimestamp')) {
            return $dateOrTime->getTimestamp();
        } else {
            return $dateOrTime->i18nFormat(Time::UNIX_TIMESTAMP_FORMAT);
        }
    }
    
    protected function _getDecay()
    {
      // decay factor in seconds per year
      // q = e^((lg Kn - lg K0) / n)
      // 0.999999978
      // 
      // SELECT TIMESTAMPDIFF(SECOND, modified, CURDATE()) AS age_in_seconds from state_balances
      // decay_for_duration = decay_factor^seconds
      // decay = gradido_cent * decay_for_duration 

      $decay_duration = intval(Time::now()->getTimestamp() - $this->convertToTimestamp($this->record_date));
      if($decay_duration === 0) {
          return $this->amount;
      }
      return $this->amount * pow(0.99999997802044727, $decay_duration);
        
    }
    public function partDecay($target_date)
    {
        $decay_duration = intval($this->convertToTimestamp($target_date) - $this->convertToTimestamp($this->record_date));
        if($decay_duration <= 0) {
            return $this->amount;
        }
        return $this->amount * pow(0.99999997802044727, $decay_duration);
    }
    
    public function decayDuration($target_date)
    {
        return intval($this->convertToTimestamp($target_date) - $this->convertToTimestamp($this->record_date));
    }
}

