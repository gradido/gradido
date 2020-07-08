<?php
namespace App\Controller;

use App\Controller\AppController;
use Model\Navigation\NaviHierarchy;
use Model\Navigation\NaviHierarchyEntry;

/**
 * Profile Controller
 */
class ProfileController extends AppController
{

    public function initialize()
    {
        parent::initialize();
        $this->Auth->allow(['index']);
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

        $this->set('user', $user);
        $this->set('timeUsed', microtime(true) - $startTime);
    }
}
