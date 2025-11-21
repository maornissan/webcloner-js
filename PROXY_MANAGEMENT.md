# Proxy Management Guide

WebCloner-JS now includes built-in proxy configuration management, allowing you to save, load, and manage multiple proxy configurations.

## Features

- **Save proxy configurations** with custom names for easy reuse
- **Load saved proxies** by name instead of typing credentials every time
- **List all saved proxies** with masked passwords for security
- **Show specific proxy details** with optional password display
- **Delete proxy configurations** when no longer needed

## Configuration Storage

Proxy configurations are stored in: `~/.webcloner-js/proxy-config.json`

## Usage Examples

### Saving a Proxy Configuration

Save proxy settings while cloning:

```bash
webcloner-js https://example.com \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --proxy-user myusername \
  --proxy-pass mypassword \
  --save-proxy my-proxy
```

This will save the proxy configuration with the name "my-proxy" for future use.

### Loading a Saved Proxy

Use a saved proxy configuration:

```bash
webcloner-js https://example.com --load-proxy my-proxy
```

### List All Saved Proxies

View all saved proxy configurations (passwords are masked by default):

```bash
webcloner-js list-proxies
```

Output:

```
📋 Saved Proxy Configurations (2):

================================================================================

🔹 Name: my-proxy
   Host: proxy.example.com
   Port: 8080
   Username: myusername
   Password: ********
   Created: 11/21/2025, 2:40:00 AM
   Updated: 11/21/2025, 2:40:00 AM

🔹 Name: backup-proxy
   Host: backup.proxy.com
   Port: 3128
   Username: admin
   Password: ********
   Created: 11/20/2025, 10:15:00 PM
   Updated: 11/20/2025, 10:15:00 PM

================================================================================

Config file: /home/user/.webcloner-js/proxy-config.json

Tip: Use --show-passwords to display passwords in plain text
```

### List Proxies with Passwords Visible

Show all proxies with passwords in plain text:

```bash
webcloner-js list-proxies --show-passwords
```

### Show Specific Proxy Details

View details of a specific proxy (password masked):

```bash
webcloner-js show-proxy my-proxy
```

Output:

```
🔹 Proxy Configuration: my-proxy

============================================================
Host:     proxy.example.com
Port:     8080
Username: myusername
Password: ********
============================================================

Tip: Use --show-password to display the password in plain text
```

### Show Proxy with Password Visible

Display a specific proxy with the password in plain text:

```bash
webcloner-js show-proxy my-proxy --show-password
```

Output:

```
🔹 Proxy Configuration: my-proxy

============================================================
Host:     proxy.example.com
Port:     8080
Username: myusername
Password: mypassword
============================================================
```

### Delete a Proxy Configuration

Remove a saved proxy configuration:

```bash
webcloner-js delete-proxy my-proxy
```

## Security Considerations

- Proxy configurations are stored in plain text in `~/.webcloner-js/proxy-config.json`
- Ensure proper file permissions on your home directory
- Passwords are masked by default when listing or showing proxies
- Use `--show-password` or `--show-passwords` flags only when necessary
- Consider using environment variables or secure vaults for sensitive production proxies

## Command Reference

### Main Clone Command Options

- `--proxy-host <host>` - Proxy host
- `--proxy-port <port>` - Proxy port
- `--proxy-user <username>` - Proxy username
- `--proxy-pass <password>` - Proxy password
- `--load-proxy <name>` - Load saved proxy configuration by name
- `--save-proxy <name>` - Save current proxy configuration with a name

### Proxy Management Commands

- `list-proxies` - List all saved proxy configurations
  - `--show-passwords` - Show passwords in plain text
- `show-proxy <name>` - Show details of a specific proxy
  - `--show-password` - Show password in plain text
- `delete-proxy <name>` - Delete a saved proxy configuration

## Examples

### Complete Workflow

1. **Save a proxy while cloning:**

   ```bash
   webcloner-js https://example.com \
     --proxy-host 10.0.0.1 \
     --proxy-port 8080 \
     --proxy-user admin \
     --proxy-pass secret123 \
     --save-proxy office-proxy
   ```

2. **List saved proxies:**

   ```bash
   webcloner-js list-proxies
   ```

3. **Use saved proxy for another clone:**

   ```bash
   webcloner-js https://another-site.com --load-proxy office-proxy
   ```

4. **View proxy details with password:**

   ```bash
   webcloner-js show-proxy office-proxy --show-password
   ```

5. **Delete when no longer needed:**
   ```bash
   webcloner-js delete-proxy office-proxy
   ```

### Multiple Proxies

You can save multiple proxy configurations for different use cases:

```bash
# Save work proxy
webcloner-js https://example.com \
  --proxy-host work.proxy.com --proxy-port 8080 \
  --proxy-user work_user --proxy-pass work_pass \
  --save-proxy work

# Save home proxy
webcloner-js https://example.com \
  --proxy-host home.proxy.com --proxy-port 3128 \
  --proxy-user home_user --proxy-pass home_pass \
  --save-proxy home

# Use different proxies as needed
webcloner-js https://site1.com --load-proxy work
webcloner-js https://site2.com --load-proxy home
```
