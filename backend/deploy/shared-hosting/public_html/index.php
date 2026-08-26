<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$application = __DIR__.'/../application';

if (file_exists($maintenance = $application.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $application.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $application.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
