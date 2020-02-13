<?php
namespace App\Controller;

use App\Controller\AppController;

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
            'contain' => ['ElopageUsers', 'AffiliatePrograms', 'Publishers', 'Orders', 'Products'],
        ];
        $elopageBuys = $this->paginate($this->ElopageBuys);

        $this->set(compact('elopageBuys'));
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
            'contain' => ['ElopageUsers', 'AffiliatePrograms', 'Publishers', 'Orders', 'Products'],
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
        $elopageUsers = $this->ElopageBuys->ElopageUsers->find('list', ['limit' => 200]);
        $affiliatePrograms = $this->ElopageBuys->AffiliatePrograms->find('list', ['limit' => 200]);
        $publishers = $this->ElopageBuys->Publishers->find('list', ['limit' => 200]);
        $orders = $this->ElopageBuys->Orders->find('list', ['limit' => 200]);
        $products = $this->ElopageBuys->Products->find('list', ['limit' => 200]);
        $this->set(compact('elopageBuy', 'elopageUsers', 'affiliatePrograms', 'publishers', 'orders', 'products'));
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
            'contain' => [],
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $elopageBuy = $this->ElopageBuys->patchEntity($elopageBuy, $this->request->getData());
            if ($this->ElopageBuys->save($elopageBuy)) {
                $this->Flash->success(__('The elopage buy has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The elopage buy could not be saved. Please, try again.'));
        }
        $elopageUsers = $this->ElopageBuys->ElopageUsers->find('list', ['limit' => 200]);
        $affiliatePrograms = $this->ElopageBuys->AffiliatePrograms->find('list', ['limit' => 200]);
        $publishers = $this->ElopageBuys->Publishers->find('list', ['limit' => 200]);
        $orders = $this->ElopageBuys->Orders->find('list', ['limit' => 200]);
        $products = $this->ElopageBuys->Products->find('list', ['limit' => 200]);
        $this->set(compact('elopageBuy', 'elopageUsers', 'affiliatePrograms', 'publishers', 'orders', 'products'));
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
