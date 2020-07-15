<?php
namespace App\Controller;

use App\Controller\AppController;
use App\Controller\CommunityProfilesController;

use Model\Navigation\NaviHierarchy;
use Model\Navigation\NaviHierarchyEntry;

use Cake\ORM\TableRegistry;
use Cake\Filesystem\File;

use App\Form\ProfileForm;

/**
 * Profile Controller
 */
class ProfileController extends AppController
{

    public function initialize()
    {
        parent::initialize();
        $this->Auth->allow(['index', 'edit']);
        $this->set(
            'naviHierarchy',
            (new NaviHierarchy())->
            add(new NaviHierarchyEntry(__('Startseite'), 'Dashboard', 'index', false))->
            add(new NaviHierarchyEntry(__('Mein Profil'), 'Profile', 'index', true))
        );
    }
    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $result = $this->requestLogin();
        if ($result !== true) {
            return $result;
        }
        $user = $session->read('StateUser');
        $communityProfile = $session->read('CommunityProfile');
        if (!isset($communityProfile)) {
            $profilesTable = TableRegistry::getTableLocator()->get('CommunityProfiles');
            $communityProfileQuery = $profilesTable
              ->find('all')
              ->select(['id', 'profile_img', 'profile_desc'])
              ->where(['state_user_id' => $user['id']]);
            if ($communityProfileQuery->count() != 1) {
                $communityProfile = $profilesTable->newEntity();
                if ($profilesTable->save($communityProfile)) {
                    $this->Flash->success(__('Neues Profil erstellt.'));
                }
            } else {
                $communityProfile = $communityProfileQuery->first();
            }
            $session->write('CommunityProfile', $communityProfile);
        }

        $this->set('user', $user);
        $this->set('communityProfile', $communityProfile);
        $this->set('timeUsed', microtime(true) - $startTime);
    }
    /**
     * Edit method
     *
     * @return \Cake\Http\Response|null
     */
    public function edit()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
        $communityProfile = $session->read('CommunityProfile');
        if (!$user) {
            $result = $this->requestLogin();
            if ($result !== true) {
                return $result;
            }
            $user = $session->read('StateUser');
        }
        $profileForm = new ProfileForm();
        if ($this->request->is('post')) {
            $requestData = $this->request->getData();
            if ($profileForm->validate($requestData)) {
                // Get a list of UploadedFile objects
                $file = $requestData['profile_img'];
                var_dump($file);
                $binaryFileData = null;
                // Read the file data.
                $type = $file['type'];
                $error = $file['error'];
                if ($error === 0 && strpos($type, 'image/') === 0) {
                    $path = new File($file['tmp_name']);
                    $binaryFileData = $path->read(true, 'r');
                }
                // Update Profile with Form Data!
                $usersTable = TableRegistry::getTableLocator()->get('StateUsers');
                $stateUserQuery = $usersTable
                  ->find('all')
                  ->select(['id', 'first_name', 'last_name'])
                  ->where(['id' => $user['id']]);
                if ($stateUserQuery->count() == 1) {
                    $stateUser = $stateUserQuery->first();
                    $stateUser = $usersTable->patchEntity($stateUser, $requestData);
                    $profilesTable = TableRegistry::getTableLocator()->get('CommunityProfiles');
                    $communityProfile = $profilesTable->patchEntity($communityProfile, $requestData);
                    $communityProfile['state_user_id'] = $user['id'];
                    if ($binaryFileData !== null) {
                        echo "schreibe neue daten";
                        $communityProfile['profile_img'] = $binaryFileData;
                    }
                    if ($profilesTable->save($communityProfile) &&
                    $usersTable->save($stateUser)
                    ) {
                        $user['first_name'] = $stateUser['first_name'];
                        $user['last_name'] = $stateUser['last_name'];
                        $session->write('StateUser.first_name', $stateUser['first_name']);
                        $session->write('StateUser.last_name', $stateUser['last_name']);
                        $session->write('CommunityProfile', $communityProfile);
                        $this->Flash->success(__('Dein Profil wurde aktualisiert!'));
                    }
                } else {
                    $this->Flash->error(__("Non-recoverable database problem - state_user doesn't exist or not unique!"));
                }
            } else {
                $this->Flash->error(__('Something was invalid, please try again!'));
            }
        }
        $this->set('user', $user);
        $this->set('communityProfile', $communityProfile);
        $this->set('profileForm', $profileForm);
        $this->set('timeUsed', microtime(true) - $startTime);
    }
}
