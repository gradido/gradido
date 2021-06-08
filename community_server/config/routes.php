<?php
/**
 * Routes configuration
 *
 * In this file, you set up routes to your controllers and their actions.
 * Routes are very important mechanism that allows you to freely connect
 * different URLs to chosen controllers and their actions (functions).
 *
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 * @link          https://cakephp.org CakePHP(tm) Project
 * @license       https://opensource.org/licenses/mit-license.php MIT License
 */
use Cake\Http\Middleware\CsrfProtectionMiddleware;
use Cake\Routing\RouteBuilder;
use Cake\Routing\Router;
use Cake\Routing\Route\DashedRoute;

use Cake\Core\Configure;

/**
 * The default class to use for all routes
 *
 * The following route classes are supplied with CakePHP and are appropriate
 * to set as the default:
 *
 * - Route
 * - InflectedRoute
 * - DashedRoute
 *
 * If no call is made to `Router::defaultRouteClass()`, the class used is
 * `Route` (`Cake\Routing\Route\Route`)
 *
 * Note that `Route` does not do any inflections on URLs which will result in
 * inconsistently cased URLs when used with `:plugin`, `:controller` and
 * `:action` markers.
 *
 * Cache: Routes are cached to improve performance, check the RoutingMiddleware
 * constructor in your `src/Application.php` file to change this behavior.
 *
 */
Router::defaultRouteClass(DashedRoute::class);

Router::scope('/', function (RouteBuilder $routes) {
  
    $csrf = new CsrfProtectionMiddleware([
        'httpOnly' => true
    ]);

    // Token check will be skipped when callback returns `true`.
    $csrf->whitelistCallback(function ($request) {
        // Skip token check for API URLs.
      //die($request->getParam('controller'));
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
    });

    // Register scoped middleware for in scopes.
    $routes->registerMiddleware('csrf', $csrf);

    /**
     * Apply a middleware to the current route scope.
     * Requires middleware to be registered via `Application::routes()` with `registerMiddleware()`
     */
    $routes->applyMiddleware('csrf');

    /**
     * Here, we are connecting '/' (base path) to a controller called 'Pages',
     * its action called 'display', and we pass a param to select the view file
     * to use (in this case, src/Template/Pages/home.ctp)...
     */
    //$routes->connect('/', ['controller' => 'Pages', 'action' => 'display', 'home']);
    $routes->connect('/', ['controller' => 'Dashboard', 'action' => 'index']);
    $routes->connect('/api/:action/*', ['controller' => 'AppRequests'], ['routeClass' => 'DashedRoute']);
    //$routes->connect('/client', ['controller' => 'Pages', 'action' => 'display', 'js']);
    $routes->connect('/server', ['controller' => 'Dashboard', 'action' => 'serverIndex']);
    $routes->connect('/client', ['controller' => 'Pages', 'action' => 'display', 'vue']);
    $routes->connect('/vue-dev', ['controller' => 'Pages', 'action' => 'display', 'vue-dev']);
    //$routes->connect('/', 'https://gradido2.dario-rekowski.de/account', array('status' => 303));

    /**
     * ...and connect the rest of 'Pages' controller's URLs.
     */
    $routes->connect('/pages/*', ['controller' => 'Pages', 'action' => 'display']);

    /**
     * Connect catchall routes for all controllers.
     *
     * Using the argument `DashedRoute`, the `fallbacks` method is a shortcut for
     *
     * ```
     * $routes->connect('/:controller', ['action' => 'index'], ['routeClass' => 'DashedRoute']);
     * $routes->connect('/:controller/:action/*', [], ['routeClass' => 'DashedRoute']);
     * ```
     *
     * Any route class can be used with this method, such as:
     * - DashedRoute
     * - InflectedRoute
     * - Route
     * - Or your own route class
     *
     * You can remove these routes once you've connected the
     * routes you want in your application.
     */
    $routes->fallbacks(DashedRoute::class);
});

/**
 * If you need a different set of middleware or none at all,
 * open new scope and define routes there.
 *
 * ```
 * Router::scope('/api', function (RouteBuilder $routes) {
 *     // No $routes->applyMiddleware() here.
 *     // Connect API actions here.
 * });
 * ```
 */
