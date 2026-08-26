# Trusted Proxy Configuration Guide

## ⚠️ Security Warning

**NEVER use `TRUSTED_PROXIES=*` (wildcard) in production.** This is a critical security vulnerability that allows IP spoofing attacks.

## Why This Matters

When your application sits behind a load balancer, CDN, or reverse proxy, Laravel needs to know which proxies to trust. If misconfigured:

- ❌ Attackers can spoof their IP address via `X-Forwarded-For` header
- ❌ Rate limiting can be bypassed
- ❌ Security logs will show proxy IP instead of real client IP
- ❌ Geo-location features will fail

## Configuration Steps

### 1. Identify Your Proxies

**For Cloudflare:**
```bash
# Get current Cloudflare IP ranges
curl https://www.cloudflare.com/ips-v4
curl https://www.cloudflare.com/ips-v6
```

**For AWS Application Load Balancer (ALB):**
- Use your VPC CIDR ranges (e.g., `10.0.0.0/16`)
- Or specific ALB subnet CIDR ranges

**For Nginx/HAProxy on same VPS:**
- Use `127.0.0.1` or specific server IPs
- Or private network CIDR (e.g., `10.0.0.0/8`)

### 2. Set Environment Variable

**Production `.env`:**
```bash
# Cloudflare (example - verify current IPs)
TRUSTED_PROXIES=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22

# AWS Private Network
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12

# Specific Load Balancer IPs
TRUSTED_PROXIES=192.168.1.10,192.168.1.11,192.168.1.12

# Multiple ranges (comma-separated)
TRUSTED_PROXIES=10.0.0.0/16,192.168.1.0/24,172.31.0.1
```

**Local/Development `.env`:**
```bash
# Wildcard is OK for local development only
TRUSTED_PROXIES=*
```

### 3. Verify Configuration

```bash
# Test that production environment rejects wildcard
APP_ENV=production TRUSTED_PROXIES=* php artisan config:cache
# Should show error: "TRUSTED_PROXIES cannot be '*' in production"

# Test with valid IPs
TRUSTED_PROXIES=192.168.1.1 php artisan config:cache
# Should succeed

# Run security tests
php artisan test --filter=TrustedProxyConfigTest
```

### 4. Deployment Checklist

- [ ] Identified all proxy/load balancer IP ranges
- [ ] Set `TRUSTED_PROXIES` in production `.env`
- [ ] Removed wildcard (`*`) configuration
- [ ] Tested proxy configuration with `config:cache`
- [ ] Verified client IP detection works correctly
- [ ] Confirmed rate limiting uses real client IPs

## Common Proxy Providers

### Cloudflare
Update periodically from: https://www.cloudflare.com/ips/

```bash
TRUSTED_PROXIES=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22
```

### AWS ALB (Application Load Balancer)
Use VPC CIDR or load balancer subnet ranges:

```bash
TRUSTED_PROXIES=10.0.0.0/16
```

### Nginx/HAProxy (Same Server)
```bash
TRUSTED_PROXIES=127.0.0.1,::1
```

### Private Docker Network
```bash
TRUSTED_PROXIES=172.17.0.0/16
```

## Testing Client IP Detection

Create a test endpoint to verify:

```php
// routes/api.php (remove after testing)
Route::get('/test-ip', function (Request $request) {
    return response()->json([
        'client_ip' => $request->ip(),
        'x_forwarded_for' => $request->header('X-Forwarded-For'),
        'trusted_proxies' => config('trustedproxy.proxies'),
    ]);
});
```

**Expected behavior:**
- Behind proxy: `client_ip` should show real user IP, not proxy IP
- Direct access: `client_ip` should show actual requester IP

## Troubleshooting

### Problem: Rate limiting not working
**Cause:** Wildcard proxies allow IP spoofing  
**Solution:** Configure explicit proxy IPs

### Problem: All requests show same IP
**Cause:** Proxy IPs not trusted, showing proxy IP  
**Solution:** Add your load balancer IPs to `TRUSTED_PROXIES`

### Problem: Application won't start in production
**Error:** `TRUSTED_PROXIES cannot be "*" in production`  
**Solution:** Good! This error prevents security vulnerability. Set explicit IPs.

### Problem: Multiple data centers/regions
**Solution:** Include CIDR ranges for all regions:
```bash
TRUSTED_PROXIES=10.0.0.0/16,172.31.0.0/16,192.168.0.0/24
```

## Security Best Practices

1. ✅ **Principle of Least Privilege:** Only trust specific IPs that need to be trusted
2. ✅ **Regular Updates:** Review and update Cloudflare/CDN IP ranges quarterly
3. ✅ **Documentation:** Maintain list of why each IP/range is trusted
4. ✅ **Monitoring:** Log and alert on suspicious `X-Forwarded-For` patterns
5. ✅ **Testing:** Automated tests prevent wildcard in production

## References

- Laravel Trusted Proxies: https://laravel.com/docs/requests#configuring-trusted-proxies
- Cloudflare IP Ranges: https://www.cloudflare.com/ips/
- OWASP HTTP Header Security: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
