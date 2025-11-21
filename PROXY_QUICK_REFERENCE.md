# Proxy Management - Quick Reference

## Save Proxy While Cloning

```bash
webcloner-js <url> \
  --proxy-host <host> \
  --proxy-port <port> \
  --proxy-user <username> \
  --proxy-pass <password> \
  --save-proxy <name>
```

## Load Saved Proxy

```bash
webcloner-js <url> --load-proxy <name>
```

## List All Proxies

```bash
# Passwords masked (default)
webcloner-js list-proxies

# Show passwords
webcloner-js list-proxies --show-passwords
```

## Show Specific Proxy

```bash
# Password masked (default)
webcloner-js show-proxy <name>

# Show password
webcloner-js show-proxy <name> --show-password
```

## Delete Proxy

```bash
webcloner-js delete-proxy <name>
```

## Config File Location

```
~/.webcloner-js/proxy-config.json
```

## Examples

### Example 1: Save and reuse work proxy

```bash
# First time - save it
webcloner-js https://example.com \
  --proxy-host work.proxy.com \
  --proxy-port 8080 \
  --proxy-user john \
  --proxy-pass secret123 \
  --save-proxy work

# Later - just load it
webcloner-js https://another-site.com --load-proxy work
```

### Example 2: Manage multiple proxies

```bash
# Save home proxy
webcloner-js https://site1.com \
  --proxy-host home.proxy.com --proxy-port 3128 \
  --proxy-user homeuser --proxy-pass homepass \
  --save-proxy home

# Save VPN proxy
webcloner-js https://site2.com \
  --proxy-host vpn.proxy.com --proxy-port 1080 \
  --proxy-user vpnuser --proxy-pass vpnpass \
  --save-proxy vpn

# List all
webcloner-js list-proxies

# Use different proxies
webcloner-js https://site3.com --load-proxy home
webcloner-js https://site4.com --load-proxy vpn
```

### Example 3: Check proxy details

```bash
# View without password
webcloner-js show-proxy work

# View with password (for verification)
webcloner-js show-proxy work --show-password
```

### Example 4: Clean up old proxies

```bash
# List all proxies
webcloner-js list-proxies

# Delete unused ones
webcloner-js delete-proxy old-proxy
webcloner-js delete-proxy temp-proxy
```

## Tips

✅ **DO:**

- Use descriptive names for proxies (e.g., "work", "home", "vpn")
- List proxies regularly to keep track of saved configurations
- Use `--show-password` only when necessary
- Delete proxies you no longer use

❌ **DON'T:**

- Share terminal output with `--show-passwords` flag
- Use the same name for different proxies (it will overwrite)
- Forget that passwords are stored in plain text

## Security Notes

⚠️ Passwords are stored **unencrypted** in `~/.webcloner-js/proxy-config.json`

- By default, passwords are **masked** when listing/showing proxies
- Use `--show-password` or `--show-passwords` flags to reveal them
- Ensure proper file permissions on your home directory
- Consider using environment variables for highly sensitive credentials
