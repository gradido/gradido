<?php
namespace App\Controller;

use App\Controller\AppController;

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
        $this->loadComponent('JsonRequestClient');
        $this->Auth->allow(['index', 'edit']);
        $this->set(
            'naviHierarchy',
            (new NaviHierarchy())->
            add(new NaviHierarchyEntry(__('Startseite'), 'Dashboard', 'index', false))->
            add(new NaviHierarchyEntry(__('Mein Profil'), 'Profile', 'index', true))
        );
    }
    /**
    * Get binary file data from request data
    *
    * @return binary data
    */
    protected function getFileData($requestData)
    {
        $binaryFileData = null;
        // Get a list of UploadedFile objects
        $file = $requestData['profile_img'];
        // Read the file data.
        $type = $file['type'];
        $error = $file['error'];
        if ($error === 0 && strpos($type, 'image/') === 0) {
            $path = new File($file['tmp_name']);
            $binaryFileData = $path->read(true, 'r');
            $this->log("binaryFileData: ".$binaryFileData, 'debug');
        }
        return $binaryFileData;
    }
    /**
    * Update Profile Data
    *
    * ...which is spread over two tables, plus needs to be promoted to the Login Server.
    *
    * @throws Exception
    */
    protected function updateProfileData($requestData, $userId, $communityProfile)
    {
        // Update Profile with Form Data!
        $usersTable = TableRegistry::getTableLocator()->get('StateUsers');
        $stateUserQuery = $usersTable
          ->find('all')
          ->select(['id', 'first_name', 'last_name'])
          ->where(['id' => $userId]);

        if ($stateUserQuery->count() == 1) {
            $stateUser = $stateUserQuery->first();
            $stateUser = $usersTable->patchEntity($stateUser, $requestData);

            $profilesTable = TableRegistry::getTableLocator()->get('CommunityProfiles');
            // Save old binary data, because the file input is always empty, in HTML!
            $oldBinaryData = $communityProfile['profile_img'];

            $communityProfile = $profilesTable->patchEntity($communityProfile, $requestData);
            $communityProfile['state_user_id'] = $userId;

            $binaryFileData = $this->getFileData($requestData);
            if ($binaryFileData !== null) {
                $this->log("CommunityProfile: Writing binary img data.", 'debug');
                $communityProfile['profile_img'] = $binaryFileData;
            } else {
                $this->log("CommunityProfile: Nothing uploaded!", 'debug');
                $communityProfile['profile_img'] = $oldBinaryData;
            }
            if ($profilesTable->save($communityProfile) &&
              $usersTable->save($stateUser)
            ) {
                $session = $this->getRequest()->getSession();
                $session_id = $session->read('session_id');
                $email = $session->read('StateUser.email');
                $this->returnJson(
                    $this->JsonRequestClient->sendRequest(
                        json_encode(
                            [
                            'session_id' => $session_id,
                            'email' => $email,
                            'update' => [
                                'User.first_name' => $requestData['first_name'],
                                'User.last_name' => $requestData['last_name']
                                ]
                            ]
                        ),
                        '/updateUserInfos'
                    )
                );
                $this->Flash->success(__('Dein Profil wurde aktualisiert!'));
            }
        } else {
            $this->Flash->error(__("Non-recoverable database problem - state_user doesn't exist or not unique!"));
        }
        return [$stateUser, $communityProfile];
    }
    /**
    * Get or create CommunityProfile
    *
    * @return \Cake\ORM\CommunityProfile
    */
    protected function getCommunityProfile($userId)
    {
        $profilesTable = TableRegistry::getTableLocator()->get('CommunityProfiles');
        $communityProfileQuery = $profilesTable
        ->find('all')
        ->select(['id', 'profile_img', 'profile_desc'])
        ->where(['state_user_id' => $userId]);
        if ($communityProfileQuery->count() != 1) {
            $communityProfile = $profilesTable->newEntity();
            if ($profilesTable->save($communityProfile)) {
                $this->log("CommunityProfile created.", 'debug');
            }
        } else {
            $communityProfile = $communityProfileQuery->first();
        }
        return $communityProfile;
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
        if (!$communityProfile) {
            $this->log("CommunityProfile not found in session! Loading or creating new one.", 'debug');
            $session->write('CommunityProfile', $this->getCommunityProfile($user['id']));
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
        if (!$communityProfile) {
            $this->log("CommunityProfile not found in session! Loading or creating new one.", 'debug');
            $session->write('CommunityProfile', $this->getCommunityProfile($user['id']));
        }

        $profileForm = new ProfileForm();
        if ($this->request->is('post')) {
            $requestData = $this->request->getData();
            if ($profileForm->validate($requestData)) {
                [$stateUser, $communityProfile] = $this->updateProfileData($requestData, $user['id'], $communityProfile);
                $user['first_name'] = $stateUser['first_name'];
                $user['last_name'] = $stateUser['last_name'];
                $session->write('StateUser.first_name', $stateUser['first_name']);
                $session->write('StateUser.last_name', $stateUser['last_name']);
                $session->write('CommunityProfile', $communityProfile);
				return $this->redirect(['action' => 'index']);
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
