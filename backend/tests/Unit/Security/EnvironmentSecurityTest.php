<?php

namespace Tests\Unit\Security;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class EnvironmentSecurityTest extends TestCase
{
    #[Test]
    public function env_file_is_not_tracked_by_git(): void
    {
        $gitRoot = base_path();

        // Check if .env is in git index
        $output = [];
        $returnCode = 0;
        exec("cd {$gitRoot} && git ls-files .env 2>&1", $output, $returnCode);

        $trackedFiles = implode("\n", $output);

        $this->assertStringNotContainsString('.env', $trackedFiles,
            '.env file should not be tracked by git. Run: git rm --cached .env');
    }

    #[Test]
    public function env_example_file_exists(): void
    {
        $this->assertFileExists(base_path('.env.example'),
            '.env.example file should exist as a template');
    }

    #[Test]
    public function env_example_contains_no_real_secrets(): void
    {
        $envExample = file_get_contents(base_path('.env.example'));

        // Check for patterns that indicate real secrets
        $this->assertStringNotContainsString('sk_live_', $envExample,
            '.env.example should not contain live Stripe keys');
        $this->assertStringNotContainsString('pk_live_', $envExample,
            '.env.example should not contain live Stripe keys');

        // Check that sensitive keys are empty or placeholder
        $lines = explode("\n", $envExample);
        foreach ($lines as $line) {
            if (str_starts_with($line, 'APP_KEY=')) {
                $this->assertEmpty(trim(substr($line, 8)),
                    'APP_KEY should be empty in .env.example');
            }
            if (str_starts_with($line, 'DB_PASSWORD=')) {
                $value = trim(substr($line, 12));
                $this->assertTrue(empty($value) || $value === 'password',
                    'DB_PASSWORD should be empty or generic in .env.example');
            }
        }
    }

    #[Test]
    public function gitignore_blocks_env_files(): void
    {
        $gitignore = file_get_contents(base_path('.gitignore'));

        $this->assertStringContainsString('.env', $gitignore,
            '.gitignore should block .env files');
        $this->assertStringContainsString('!.env.example', $gitignore,
            '.gitignore should allow .env.example');
    }

    #[Test]
    public function sensitive_config_values_use_env(): void
    {
        // Verify that critical config files use env() and don't hardcode secrets
        $configFiles = [
            'database.php' => ['password', 'username'],
            'mail.php' => ['password'],
            'services.php' => ['secret', 'key'],
        ];

        foreach ($configFiles as $file => $sensitiveKeys) {
            $path = config_path($file);
            if (! file_exists($path)) {
                continue;
            }

            $content = file_get_contents($path);

            foreach ($sensitiveKeys as $key) {
                // Check if the key appears but make sure it uses env()
                if (str_contains(strtolower($content), "'{$key}'")) {
                    $this->assertStringContainsString('env(', $content,
                        "{$file} should use env() for sensitive values");
                }
            }
        }
    }
}
