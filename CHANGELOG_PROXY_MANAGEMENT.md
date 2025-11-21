# Proxy Management Feature - Changelog

## New Features Added

### 1. Proxy Configuration Storage

- Created `config-manager.ts` module for managing proxy configurations
- Configurations stored in `~/.webcloner-js/proxy-config.json`
- Each proxy config includes: name, host, port, username, password, timestamps

### 2. CLI Commands

#### Main Clone Command Enhancements

- `--save-proxy <name>` - Save current proxy configuration with a custom name
- `--load-proxy <name>` - Load a previously saved proxy configuration

#### New Proxy Management Commands

- `list-proxies` - List all saved proxy configurations
  - `--show-passwords` - Display passwords in plain text (default: masked)
- `show-proxy <name>` - Show details of a specific proxy configuration
  - `--show-password` - Display password in plain text (default: masked)
- `delete-proxy <name>` - Delete a saved proxy configuration

### 3. Security Features

- Passwords are masked by default (shown as `********`)
- Explicit flags required to display passwords in plain text
- Clear warnings in documentation about password storage

### 4. Documentation

- Created `PROXY_MANAGEMENT.md` - Complete guide for proxy management
- Updated `README.md` with proxy management features
- Added usage examples and security considerations

## Usage Examples

### Save and Reuse Proxy

```bash
# Save proxy while cloning
webcloner-js https://example.com \
  --proxy-host proxy.example.com \
  --proxy-port 8080 \
  --proxy-user myuser \
  --proxy-pass mypass \
  --save-proxy work-proxy

# Reuse saved proxy
webcloner-js https://another-site.com --load-proxy work-proxy
```

### Manage Multiple Proxies

```bash
# List all saved proxies (passwords masked)
webcloner-js list-proxies

# Show specific proxy with password
webcloner-js show-proxy work-proxy --show-password

# Delete proxy
webcloner-js delete-proxy work-proxy
```

## Files Modified/Created

### New Files

- `src/config-manager.ts` - Proxy configuration management module
- `PROXY_MANAGEMENT.md` - Complete documentation
- `CHANGELOG_PROXY_MANAGEMENT.md` - This file

### Modified Files

- `src/cli.ts` - Added proxy management commands and options
- `README.md` - Updated with proxy management features

## Technical Details

### Config File Structure

```json
{
  "proxies": {
    "proxy-name": {
      "name": "proxy-name",
      "host": "proxy.example.com",
      "port": 8080,
      "username": "user",
      "password": "pass",
      "createdAt": "2025-11-21T00:40:00.000Z",
      "updatedAt": "2025-11-21T00:40:00.000Z"
    }
  }
}
```

### API Functions

- `saveProxyConfig(name, config)` - Save a proxy configuration
- `loadProxyConfig(name)` - Load a proxy configuration
- `listProxyConfigs()` - Get all saved proxies
- `deleteProxyConfig(name)` - Delete a proxy configuration
- `getConfigPath()` - Get config file path

## Benefits

1. **Convenience** - No need to type proxy credentials repeatedly
2. **Multiple Proxies** - Easily switch between different proxy configurations
3. **Security** - Passwords masked by default in listings
4. **Organization** - Name and manage multiple proxy configurations
5. **Timestamps** - Track when proxies were created and updated

## Security Considerations

⚠️ **Important**: Proxy configurations are stored in plain text in the config file. Users should:

- Ensure proper file permissions on their home directory
- Use the password masking feature when sharing terminal output
- Consider using environment variables for highly sensitive proxies
- Be aware that passwords are stored unencrypted

## Future Enhancements (Potential)

- Encryption of stored passwords
- Import/export proxy configurations
- Proxy testing/validation
- Default proxy setting
- Proxy groups/profiles
- Integration with system keychain/credential managers
