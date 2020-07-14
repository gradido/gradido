<?php
namespace App\Controller;

use App\Controller\AppController;
use Cake\ORM\TableRegistry;
use Cake\Http\Client;
use Cake\Core\Configure;
use Cake\Routing\Router;

use Cake\I18n\I18n;

use App\Form\TransferForm;
use App\Form\TransferRawForm;

use Model\Navigation\NaviHierarchy;
use Model\Navigation\NaviHierarchyEntry;

use Model\Transactions\TransactionTransfer;
use Model\Transactions\TransactionBody;
use Model\Transactions\Transaction;

/**
 * TransactionSendCoins Controller
 *
 * @property \App\Model\Table\TransactionSendCoinsTable $TransactionSendCoins
 *
 * @method \App\Model\Entity\TransactionSendCoin[]|\Cake\Datasource\ResultSetInterface paginate($object = null, array $settings = [])
 */
class TransactionSendCoinsController extends AppController
{

    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('GradidoNumber');
        $this->loadComponent('JsonRequestClient');
        //$this->Auth->allow(['add', 'edit']);
        $this->Auth->allow('create');
        $this->Auth->allow('createRaw');
        $this->set(
            'naviHierarchy',
            (new NaviHierarchy())->
            add(new NaviHierarchyEntry(__('Startseite'), 'Dashboard', 'index', false))->
            add(new NaviHierarchyEntry(__('Überweisung'), 'TransactionSendCoins', 'create', true))
        );
    }

    /**
     * Index method
     *
     * @return \Cake\Http\Response|null
     */
    public function index()
    {
        $this->paginate = [
            'contain' => ['Transactions', 'StateUsers', 'ReceiverUsers']
        ];
        $transactionSendCoins = $this->paginate($this->TransactionSendCoins);

        $this->set(compact('transactionSendCoins'));
    }

    /**
     * View method
     *
     * @param string|null $id Transaction Send Coin id.
     * @return \Cake\Http\Response|null
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $transactionSendCoin = $this->TransactionSendCoins->get($id, [
            'contain' => ['Transactions', 'StateUsers', 'ReceiverUsers']
        ]);

        $this->set('transactionSendCoin', $transactionSendCoin);
    }

    /**
     * Add method
     *
     * @return \Cake\Http\Response|null Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $transactionSendCoin = $this->TransactionSendCoins->newEntity();
        if ($this->request->is('post')) {
            $transactionSendCoin = $this->TransactionSendCoins->patchEntity($transactionSendCoin, $this->request->getData());
            if ($this->TransactionSendCoins->save($transactionSendCoin)) {
                $this->Flash->success(__('The transaction send coin has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction send coin could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionSendCoins->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionSendCoins->StateUsers->find('list', ['limit' => 200]);
        $receiverUsers = $this->TransactionSendCoins->ReceiverUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionSendCoin', 'transactions', 'stateUsers', 'receiverUsers'));
    }

    /**
     * Edit method
     *
     * @param string|null $id Transaction Send Coin id.
     * @return \Cake\Http\Response|null Redirects on successful edit, renders view otherwise.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function edit($id = null)
    {
        $transactionSendCoin = $this->TransactionSendCoins->get($id, [
            'contain' => []
        ]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $transactionSendCoin = $this->TransactionSendCoins->patchEntity($transactionSendCoin, $this->request->getData());
            if ($this->TransactionSendCoins->save($transactionSendCoin)) {
                $this->Flash->success(__('The transaction send coin has been saved.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The transaction send coin could not be saved. Please, try again.'));
        }
        $transactions = $this->TransactionSendCoins->Transactions->find('list', ['limit' => 200]);
        $stateUsers = $this->TransactionSendCoins->StateUsers->find('list', ['limit' => 200]);
        $receiverUsers = $this->TransactionSendCoins->ReceiverUsers->find('list', ['limit' => 200]);
        $this->set(compact('transactionSendCoin', 'transactions', 'stateUsers', 'receiverUsers'));
    }

    public function create()
    {
        /*$locale = I18n::getLocale();
        $defaultLocale = I18n::getDefaultLocale();
        echo "locale: $locale, default locale: $defaultLocale<br>";
         * */
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');
        $session = $this->getRequest()->getSession();
        $user = $session->read('StateUser');
//        var_dump($user);
        if (!$user) {
          //return $this->redirect(Router::url('/', true) . 'account/', 303);
            $result = $this->requestLogin();
            if ($result !== true) {
                return $result;
            }
            $user = $session->read('StateUser');
        }

        $transferForm = new TransferForm();
        $this->set('transferForm', $transferForm);
        $this->set('timeUsed', microtime(true) - $startTime);

        if ($this->request->is('post')) {
          //$this->Flash->error(__('Wird zurzeit noch entwickelt!'));

            $requestData = $this->request->getData();
            $mode = 'next';
            if (isset($requestData['add'])) {
                $mode = 'add';
            }
            if ($transferForm->validate($requestData)) {
                $receiverPubKeyHex = '';
                $senderPubKeyHex = $user['public_hex'];
                $amountCent = $this->GradidoNumber->parseInputNumberToCentNumber($requestData['amount']);

                if (!isset($user['balance']) || $amountCent > $user['balance']) {
                    $this->Flash->error(__('Du hast nicht genug Geld!'));
                    return;
                }

                $receiverEmail = $requestData['email'];
                if ($receiverEmail === $user['email']) {
                    $this->Flash->error(__('Du kannst dir leider nicht selbst Geld schicken!'));
                    return;
                }
                $receiverPubkeyHex ='';
                $response = $this->JsonRequestClient->sendRequest(json_encode([
                'session_id' => $session->read('session_id'),
                'email' => $receiverEmail,
                'ask' => ['user.pubkeyhex']
                ]), '/getUserInfos');
                if ('success' == $response['state'] && 'success' == $response['data']['state']) {
                    // will be allways 64 byte long, even if it is empty
                    $receiverPubKeyHex = $response['data']['userData']['pubkeyhex'];
                } elseif ('success' == $response['state'] && 'not found' == $response['data']['state']) {
                    return $this->redirect($this->loginServerUrl . 'account', 303);
                } else {
                    $this->addAdminError('TransactionSendCoins', 'create', $response, $user['id']);
                    $this->Flash->error(__('Der Empfänger wurde nicht auf dem Login-Server gefunden, hat er sein Konto schon angelegt?'));
                    $this->set('timeUsed', microtime(true) - $startTime);
                    return;
                }

                if (0 == ord($receiverPubKeyHex)) {
                    $stateUserTable = TableRegistry::getTableLocator()->get('StateUsers');
                    $receiverUser = $stateUserTable
                       ->find('all')
                       ->select(['public_key'])
                       ->contain(false)
                       ->where(['email' => $receiverEmail]);


                    if (!$receiverUser) {
                        $this->Flash->error(__('Diese E-Mail ist mir nicht bekannt, hat dein Empfänger denn schon ein Gradido-Konto?'));
                        $this->set('timeUsed', microtime(true) - $startTime);
                        return;
                    }

                    if (isset($receiverUser->public_key)) {
                        $receiverPubKeyHex = bin2hex(stream_get_contents($receiverUser->public_key));
                    } else {
                        $this->Flash->error(__('Das Konto mit der E-Mail: ' . $receiverEmail . ' wurde noch nicht aktiviert und kann noch keine GDD empfangen!'));
                        $this->set('timeUsed', microtime(true) - $startTime);
                        return;
                    }
                }
              //var_dump($sessionStateUser);

                $builderResult = TransactionTransfer::build(
                    $amountCent,
                    $requestData['memo'],
                    $receiverPubKeyHex,
                    $senderPubKeyHex
                );
                if ($builderResult['state'] === 'success') {
                    $http = new Client();
                    try {
                        $loginServer = Configure::read('LoginServer');
                        $url = $loginServer['host'] . ':' . $loginServer['port'];
                        $session_id = $session->read('session_id');
                      /*
                       *
                       *  $response = $http->post(
                       *    'http://example.com/tasks',
                       *    json_encode($data),
                       *    ['type' => 'json']
                       *  );
                       */
                        $response = $http->post($url . '/checkTransaction', json_encode([
                        'session_id' => $session_id,
                        'transaction_base64' => base64_encode($builderResult['transactionBody']->serializeToString()),
                        'balance' => $user['balance']
                        ]), ['type' => 'json']);
                        $json = $response->getJson();
                        if ($json['state'] != 'success') {
                            if ($json['msg'] == 'session not found') {
                                $session->destroy();
                                return $this->redirect($this->loginServerUrl . 'account', 303);
                          //$this->Flash->error(__('session not found, please login again'));
                            } else {
                                $this->Flash->error(__('login server return error: ' . json_encode($json)));
                            }
                        } else {
                            $pendingTransactionCount = $session->read('Transactions.pending');
                            if ($pendingTransactionCount == null) {
                                $pendingTransactionCount = 1;
                            } else {
                                $pendingTransactionCount++;
                            }
                            $session->write('Transactions.pending', $pendingTransactionCount);
                    //echo "pending: " . $pendingTransactionCount;
                            if ($mode === 'next') {
                                return $this->redirect($this->loginServerUrl . 'account/checkTransactions', 303);
                            } else {
                                $this->Flash->success(__('Transaction submitted for review.'));
                            }
                        }
                    } catch (\Exception $e) {
                        $msg = $e->getMessage();
                        $this->Flash->error(__('error http request: ') . $msg);
                    }
                } else {
                    $this->Flash->error(__('No Valid Receiver Public given: ' . $receiverPubKeyHex));
                }

  //           */
            } else {
                $this->Flash->error(__('Something was invalid, please try again!'));
            }
        }

        $this->set('timeUsed', microtime(true) - $startTime);
    }

    public function createRaw()
    {
        $startTime = microtime(true);
        $this->viewBuilder()->setLayout('frontend');

        $transferRawForm = new TransferRawForm();
        $this->set('transferRawForm', $transferRawForm);

        if ($this->request->is('post')) {
            $requestData = $this->request->getData();
            if ($transferRawForm->validate($requestData)) {
                $amountCent = $this->GradidoNumber->parseInputNumberToCentNumber($requestData['amount']);
                $sender = ['priv' => $requestData['sender_privkey_hex'], 'pub' => $requestData['sender_pubkey_hex']];
                $reciver = ['pub' => $requestData['receiver_pubkey_hex']];

                $builderResult = TransactionTransfer::build(
                    $amountCent,
                    $requestData['memo'],
                    $reciver['pub'],
                    $sender['pub']
                );
                if ($builderResult['state'] === 'success') {
                    $protoTransaction = Transaction::build($builderResult['transactionBody'], $sender);
                    $transaction = new Transaction($protoTransaction);
                    if (!$transaction->validate()) {
                        $this->Flash->error(__('Error validating transaction'));
                    } else {
                        if (!$transaction->save()) {
                            $this->Flash->error(__('Error saving transaction'));
                        } else {
                            $this->Flash->success(__('Gradidos erfolgreich überwiesen!'));
                        }
                    }
                } else {
                    $this->Flash->error(__('Error building transaction'));
                }
            }
          //var_dump($requestData);
          //
          //var_dump($data);
        }

        $this->set('timeUsed', microtime(true) - $startTime);
    }

    /**
     * Delete method
     *
     * @param string|null $id Transaction Send Coin id.
     * @return \Cake\Http\Response|null Redirects to index.
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $transactionSendCoin = $this->TransactionSendCoins->get($id);
        if ($this->TransactionSendCoins->delete($transactionSendCoin)) {
            $this->Flash->success(__('The transaction send coin has been deleted.'));
        } else {
            $this->Flash->error(__('The transaction send coin could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}
