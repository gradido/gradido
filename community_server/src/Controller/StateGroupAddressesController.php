<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * StateGroupAddresses Controller
 *
 * @property \App\Model\Table\StateGroupAddressesTable $StateGroupAddresses
 *
 * @method \App\Model\Entity\StateGroupAddress[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class StateGroupAddressesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['StateGroups', 'AddressTypes']
        ];
        $stateGroupAddresses = $this->paginate($this->StateGroupAddresses);

        $this->set(compact('stateGroupAddresses'));
    }

    /**
     * View method
     *
     * @param string|null $id State Group Address id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $stateGroupAddress = $this->StateGroupAddresses->get($id, [
            'contain' => ['StateGroups', 'AddressTypes']
        ]);

        $this->set('stateGroupAddress', $stateGroupAddress);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $stateGroupAddress = $this->StateGroupAddresses->newEntity();
        if ($this->request->is('post')) {
            $stateGroupAddress = $this->StateGroupAddresses->patchEntity($stateGroupAddress, $this->request->getData());
            if ($this->StateGroupAddresses->save($stateGroupAddress)) {
                $this->Flash->success(__('The state group address has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state group address could not be saved. Please, try again.'));
        }
        $stateGroups = $this->StateGroupAddresses->StateGroups->find('list', ['limit' => 200]);
        $addressTypes = $this->StateGroupAddresses->AddressTypes->find('list', ['limit' => 200]);
        $this->set(compact('stateGroupAddress', 'stateGroups', 'addressTypes'));
    }

    /**
     * Edit method
     *
     * @param string|null $id State Group Address id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $stateGroupAddress = $this->StateGroupAddresses->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $stateGroupAddress = $this->StateGroupAddresses->patchEntity($stateGroupAddress, $this->request->getData());
            if ($this->StateGroupAddresses->save($stateGroupAddress)) {
                $this->Flash->success(__('The state group address has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The state group address could not be saved. Please, try again.'));
        }
        $stateGroups = $this->StateGroupAddresses->StateGroups->find('list', ['limit' => 200]);
        $addressTypes = $this->StateGroupAddresses->AddressTypes->find('list', ['limit' => 200]);
        $this->set(compact('stateGroupAddress', 'stateGroups', 'addressTypes'));
    }

    /**
     * Delete method
     *
     * @param string|null $id State Group Address id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $stateGroupAddress = $this->StateGroupAddresses->get($id);
        if ($this->StateGroupAddresses->delete($stateGroupAddress)) {
            $this->Flash->success(__('The state group address has been deleted.'));
        } else {
            $this->Flash->error(__('The state group address could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
