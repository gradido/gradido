<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * BlockchainTypes Controller
 *
 * @property \App\Model\Table\BlockchainTypesTable $BlockchainTypes
 *
 * @method \App\Model\Entity\BlockchainType[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class BlockchainTypesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $blockchainTypes = $this->paginate($this->BlockchainTypes);

        $this->set(compact('blockchainTypes'));
    }

    /**
     * View method
     *
     * @param string|null $id Blockchain Type id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $blockchainType = $this->BlockchainTypes->get($id, [
            'contain' => [],
        ]);

        $this->set('blockchainType', $blockchainType);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $blockchainType = $this->BlockchainTypes->newEntity();
        if ($this->request->is('post')) {
            $blockchainType = $this->BlockchainTypes->patchEntity($blockchainType, $this->request->getData());
            if ($this->BlockchainTypes->save($blockchainType)) {
                $this->Flash->success(__('The blockchain type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The blockchain type could not be saved. Please, try again.'));
        }
        $this->set(compact('blockchainType'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Blockchain Type id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $blockchainType = $this->BlockchainTypes->get($id, [
            'contain' => [],
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $blockchainType = $this->BlockchainTypes->patchEntity($blockchainType, $this->request->getData());
            if ($this->BlockchainTypes->save($blockchainType)) {
                $this->Flash->success(__('The blockchain type has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The blockchain type could not be saved. Please, try again.'));
        }
        $this->set(compact('blockchainType'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Blockchain Type id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $blockchainType = $this->BlockchainTypes->get($id);
        if ($this->BlockchainTypes->delete($blockchainType)) {
            $this->Flash->success(__('The blockchain type has been deleted.'));
        } else {
            $this->Flash->error(__('The blockchain type could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
