<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\I18n\Number;

/**
 * AddressTypes Controller
 *
 * @property \App\Model\Table\AddressTypesTable $AddressTypes
 *
 * @method \App\Model\Entity\AddressType[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class AddressTypesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $addressTypes = $this->paginate($this->AddressTypes);

        $this->set(compact('addressTypes'));
    }

    /**
     * View method
     *
     * @param string|null $id Address Type id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $addressType = $this->AddressTypes->get($id, [
            'contain' => ['StateGroupAddresses', 'TransactionGroupAddaddress']
        ]);

        $this->set('addressType', $addressType);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $addressType = $this->AddressTypes->newEntity();
        if ($this->request->is('post')) {
            $addressType = $this->AddressTypes->patchEntity($addressType, $this->request->getData());
            if ($this->AddressTypes->save($addressType)) {
                $this->Flash->success(__('The address type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The address type could not be saved. Please, try again.'));
        }
        $this->set(compact('addressType'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Address Type id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $addressType = $this->AddressTypes->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $addressType = $this->AddressTypes->patchEntity($addressType, $this->request->getData());
            if ($this->AddressTypes->save($addressType)) {
                $this->Flash->success(__('The address type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The address type could not be saved. Please, try again.'));
        }
        $this->set(compact('addressType'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Address Type id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $addressType = $this->AddressTypes->get($id);
        if ($this->AddressTypes->delete($addressType)) {
            $this->Flash->success(__('The address type has been deleted.'));
        } else {
            $this->Flash->error(__('The address type could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
