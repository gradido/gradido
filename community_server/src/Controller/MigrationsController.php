<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * Migrations Controller
 *
 * @property \App\Model\Table\MigrationsTable $Migrations
 *
 * @method \App\Model\Entity\Migration[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class MigrationsController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $migrations = $this->paginate($this->Migrations);

        $this->set(compact('migrations'));
    }

    /**
     * View method
     *
     * @param string|null $id Migration id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $migration = $this->Migrations->get($id, [
            'contain' => [],
        ]);

        $this->set('migration', $migration);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $migration = $this->Migrations->newEntity();
        if ($this->request->is('post')) {
            $migration = $this->Migrations->patchEntity($migration, $this->request->getData());
            if ($this->Migrations->save($migration)) {
                $this->Flash->success(__('The migration has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The migration could not be saved. Please, try again.'));
        }
        $this->set(compact('migration'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Migration id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $migration = $this->Migrations->get($id, [
            'contain' => [],
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $migration = $this->Migrations->patchEntity($migration, $this->request->getData());
            if ($this->Migrations->save($migration)) {
                $this->Flash->success(__('The migration has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The migration could not be saved. Please, try again.'));
        }
        $this->set(compact('migration'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Migration id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $migration = $this->Migrations->get($id);
        if ($this->Migrations->delete($migration)) {
            $this->Flash->success(__('The migration has been deleted.'));
        } else {
            $this->Flash->error(__('The migration could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
