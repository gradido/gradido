<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\Datasource\ConnectionManager;
use Cake\I18n\Time;
//use Cake\I18n\Date;

use Cake\ORM\TableRegistry;

/**
 * ElopageBuys Controller
 *
 * @property \App\Model\Table\ElopageBuysTable $ElopageBuys
 *
 * @method \App\Model\Entity\ElopageBuy[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class ElopageBuysController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => false,
        ];
        $elopageBuys = $this->paginate($this->ElopageBuys);

        $this->set(compact('elopageBuys'));
    }
    
    public function statistics()
    {
        $this->viewBuilder()->setLayout('frontend');
        $connection = ConnectionManager::get('loginServer');
        $dates = $connection->execute('SELECT success_date FROM elopage_buys group by CAST(success_date as DATE)')->fetchAll('assoc');
       
        $datesTree = [];
        foreach($dates as $i => $date) {
          
          $date = new Time($date['success_date']);
          if(!isset($datesTree[$date->year])) {
            $datesTree[$date->year] = [];
          }
          if(!isset($datesTree[$date->year][$date->month])) {
            $datesTree[$date->year][$date->month] = true;
          }
        }
        //var_dump($datesTree);
        
        $now = Time::now();
        $lastDay = Time::now();
        $lastDay->day = 1;
        $now->day = 1;
        $lastDay->setTime(0,0,0,0);
        $now->setTime(0,0,0,0);
        // only for test
        $now->month = 11;
        $lastDay->month = 11;
        $now->year = 2019;
        $lastDay->year = 2019;
//        var_dump($now);

        $lastDay = $lastDay->addMonth(1);
        $sortDate = $this->getStartEndForMonth(11, 2019);
        $elopageBuys = $this->ElopageBuys
                ->find('all')
                ->where(['success_date >=' => $sortDate[0], 'success_date <' => $sortDate[1]]); 
        $users = [];
        foreach($elopageBuys as $elopageEntry) {
          array_push($users, $elopageEntry->payer_email);
        }
        $unique_users = array_unique($users);
        
        $userTable = TableRegistry::getTableLocator()->get('Users');
        $users = $userTable->find('all')
                           ->where(['created >=' => $sortDate[0], 'created <' => $sortDate[1]]);
        
        $this->set(compact('elopageBuys', 'users'));
    }

    /**
     * View method
     *
     * @param string|null $id Elopage Buy id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $elopageBuy = $this->ElopageBuys->get($id, [
            'contain' => false,
        ]);

        $this->set('elopageBuy', $elopageBuy);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $elopageBuy = $this->ElopageBuys->newEntity();
        if ($this->request->is('post')) {
            $elopageBuy = $this->ElopageBuys->patchEntity($elopageBuy, $this->request->getData());
            if ($this->ElopageBuys->save($elopageBuy)) {
                $this->Flash->success(__('The elopage buy has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The elopage buy could not be saved. Please, try again.'));
        }
        
        $this->set(compact('elopageBuy'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Elopage Buy id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $elopageBuy = $this->ElopageBuys->get($id, [
            'contain' => false,
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $elopageBuy = $this->ElopageBuys->patchEntity($elopageBuy, $this->request->getData());
            if ($this->ElopageBuys->save($elopageBuy)) {
                $this->Flash->success(__('The elopage buy has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The elopage buy could not be saved. Please, try again.'));
        }
        $this->set(compact('elopageBuy'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Elopage Buy id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $elopageBuy = $this->ElopageBuys->get($id);
        if ($this->ElopageBuys->delete($elopageBuy)) {
            $this->Flash->success(__('The elopage buy has been deleted.'));
        } else {
            $this->Flash->error(__('The elopage buy could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
