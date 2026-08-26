<?php

use Laravel\Fortify\Features;

return [
    'guard' => 'web', 'passwords' => 'users', 'username' => 'email', 'email' => 'email',
    'home' => null, 'prefix' => 'api/v1/fortify', 'domain' => null, 'middleware' => ['web'],
    'limiters' => ['login' => 'login', 'two-factor' => 'two-factor'], 'views' => false,
    'features' => [
        Features::resetPasswords(), Features::emailVerification(), Features::updatePasswords(),
        Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true]),
    ],
];
