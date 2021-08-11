<?php
/**
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 * @link      https://cakephp.org CakePHP(tm) Project
 * @since     3.3.0
 * @license   https://opensource.org/licenses/mit-license.php MIT License
 */
namespace App;

use Cake\Core\Configure;
use Cake\Core\Exception\MissingPluginException;
use Cake\Error\Middleware\ErrorHandlerMiddleware;
use Cake\Http\BaseApplication;
use Cake\Http\Middleware\CsrfProtectionMiddleware;
use Cake\Routing\Middleware\AssetMiddleware;
use Cake\Routing\Middleware\RoutingMiddleware;



/**
 * Application setup class.
 *
 * This defines the bootstrapping logic and middleware layers you
 * want to use in your application.
 */
class Application extends BaseApplication
{
    /**
     * {@inheritDoc}
     */
    public function bootstrap()
    {
        // Call parent to load bootstrap from files.
        parent::bootstrap();

        if (PHP_SAPI === 'cli') {
            $this->bootstrapCli();
        }

        /*
         * Only try to load DebugKit in development mode
         * Debug Kit should not be installed on a production system
         */
        if (Configure::read('debug')) {
            $this->addPlugin(\DebugKit\Plugin::class);
        }

        // Load more plugins here
    }
    


    /**
     * Setup the middleware queue your application will use.
     *
     * @param \Cake\Http\MiddlewareQueue $middlewareQueue The middleware queue to setup.
     * @return \Cake\Http\MiddlewareQueue The updated middleware queue.
     */
    public function middleware($middlewareQueue)
    {
        $csrf = new CsrfProtectionMiddleware();

        // Token check will be skipped when callback returns `true`.
        $csrf->whitelistCallback(function ($request) {
            // Skip token check for API URLs.
            $whitelist = ['JsonRequestHandler', 'ElopageWebhook', 'AppRequests'];
            $ajaxWhitelist = ['TransactionSendCoins', 'TransactionCreations'];

            $callerIp = $request->clientIp();

            foreach($whitelist as $entry) {
              if($request->getParam('controller') === $entry) {
                if($entry == 'ElopageWebhook' || $entry == 'AppRequests') {
                  return true;
                }
                $allowedIpLocalhost = ['127.0.0.1', 'localhost', '', '::1'];
                if(in_array($callerIp, $allowedIpLocalhost)) {
                    return true;
                }
                $allowedCaller = Configure::read('API.allowedCaller');
                $ipPerHost = [];
                if($allowedCaller && count($allowedCaller) > 0) {

                    foreach($allowedCaller as $allowed) {
                      $ip = gethostbyname($allowed);
                      $ipPerHost[$allowed] = $ip;
                      if($ip === $callerIp) return true;
                    }
                    //die("caller ip: $callerIp<br>");
                }
                            //var_dump(['caller_ip' => $callerIp, 'ips' => $ipPerHost]);
                die(json_encode(['state' => 'error', 'details' => ['caller_ip' => $callerIp, 'ips' => $ipPerHost]]));
              }
            }
            // disable csfr for all ajax requests in ajax whitelisted controller
            foreach($ajaxWhitelist as $entry) {
                if($request->getParam('controller') === $entry) {
                    $action = $request->getParam('action');
                    if(preg_match('/^ajax/', $action)) {
                        return true;
                    }
                }
            }
        
        /*    if($request->getAttribute('base') === 'TransactionJsonRequestHandler') {
                return true;
            }
         * */
        });
//*/
        // Ensure routing middleware is added to the queue before CSRF protection middleware.
        //$middlewareQueue->;
        
        $middlewareQueue
  //          ->add($csrf)
            // Catch any exceptions in the lower layers,
            // and make an error page/response
            ->add(new ErrorHandlerMiddleware(null, Configure::read('Error')))

            // Handle plugin/theme assets like CakePHP normally does.
            ->add(new AssetMiddleware([
                'cacheTime' => Configure::read('Asset.cacheTime')
            ]))

            // Add routing middleware.
            // If you have a large number of routes connected, turning on routes
            // caching in production could improve performance. For that when
            // creating the middleware instance specify the cache config name by
            // using it's second constructor argument:
            // `new RoutingMiddleware($this, '_cake_routes_')`
            ->add(new RoutingMiddleware($this));

        return $middlewareQueue;
    }

    /**
     * @return void
     */
    protected function bootstrapCli()
    {
        try {
            $this->addPlugin('Bake');
        } catch (MissingPluginException $e) {
            // Do not halt if the plugin is missing
        }

        $this->addPlugin('Migrations');

        // Load more plugins here
    }
}
