<?php

namespace App\Providers;

use App\Models\Usuario;
use Illuminate\Support\Facades\Artisan;
use Native\Desktop\Facades\Window;
use Native\Desktop\Contracts\ProvidesPhpIni;

class NativeAppServiceProvider implements ProvidesPhpIni
{
    /**
     * Executed once the native application has been booted.
     * Use this method to open windows, register global shortcuts, etc.
     */
    public function boot(): void
    {
        // First run on this machine: the NativePHP database is freshly
        // migrated but empty, so seed it before the user hits the login.
        if (Usuario::count() === 0) {
            Artisan::call('native:seed');
        }

        Window::open();
    }

    /**
     * Return an array of php.ini directives to be set.
     */
    public function phpIni(): array
    {
        return [
        ];
    }
}
