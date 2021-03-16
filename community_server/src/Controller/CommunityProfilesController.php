<?php
namespace App\Controller;

use App\Controller\AppController;

/**
 * CommunityProfiles Controller
 *
 * @property \App\Model\Table\CommunityProfilesTable $CommunityProfiles
 *
 * @method \App\Model\Entity\CommunityProfile[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class CommunityProfilesController extends AppController
{
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $communityProfiles = $this->paginate($this->CommunityProfiles);

        $this->set(compact('communityProfiles'));
    }

    /**
     * View method
     *
     * @param string|null $id Community Profile id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $communityProfile = $this->CommunityProfiles->get($id, [
            'contain' => [],
        ]);

        $this->set('communityProfile', $communityProfile);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $communityProfile = $this->CommunityProfiles->newEntity();
        if ($this->request->is('post')) {
            $communityProfile = $this->CommunityProfiles->patchEntity($communityProfile, $this->request->getData());
            if ($this->CommunityProfiles->save($communityProfile)) {
                $this->Flash->success(__('The community profile has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The community profile could not be saved. Please, try again.'));
        }
        $this->set(compact('communityProfile'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Community Profile id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $communityProfile = $this->CommunityProfiles->get($id, [
            'contain' => [],
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $communityProfile = $this->CommunityProfiles->patchEntity($communityProfile, $this->request->getData());
            if ($this->CommunityProfiles->save($communityProfile)) {
                $this->Flash->success(__('The community profile has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The community profile could not be saved. Please, try again.'));
        }
        $this->set(compact('communityProfile'));
    }

    /**
     * Delete method
     *
     * @param string|null $id Community Profile id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $communityProfile = $this->CommunityProfiles->get($id);
        if ($this->CommunityProfiles->delete($communityProfile)) {
            $this->Flash->success(__('The community profile has been deleted.'));
        } else {
            $this->Flash->error(__('The community profile could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
