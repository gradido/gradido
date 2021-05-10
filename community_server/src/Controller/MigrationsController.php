<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;

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
    
    protected function callFunctions(array $callables)
    {
        foreach($callables as $callable) {
            $result = call_user_func($callable);
            if(!$result['success']) {
                return $result;
            }
        }
        return ['success' => true];
    }
    
    public function migrate($html, $current_db_version) 
    {
        $startTime = microtime(true);
        $stateUserTransactionsTable = TableRegistry::getTableLocator()->get('StateUserTransactions');
        $transactionsTable = TableRegistry::getTableLocator()->get('Transactions');
        $stateBalancesTable = TableRegistry::getTableLocator()->get('StateBalances');
        
        $new_db_version = 1;
        
        $commands = [];
        // migrate from version 1 to 2
        if($current_db_version == 1) {    
            $stateUserTransactionsTable->truncate();
            $commands = [
                [$transactionsTable, 'fillStateUserTransactions'],
                [$stateBalancesTable, 'updateAllBalances']
            ];
            $new_db_version = 2;
        }
        
        $migration_result = $this->callFunctions($commands);
        if($migration_result['success']) {
            $migration_entity = $this->Migrations->newEntity();
            $migration_entity->db_version = $new_db_version;
            $this->Migrations->save($migration_entity);
        }
        if(!$html) {
            return $this->returnJson($migration_result);
        } else {
            $this->set('db_version', $current_db_version);
            $this->set('result', $migration_result);
            $this->set('timeUsed', microtime(true) - $startTime);
        }
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
