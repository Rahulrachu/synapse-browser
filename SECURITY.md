# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x | Yes |
| < 1.0 | No |

## Reporting a Vulnerability

We take the security of Synapse Browser seriously. If you discover a security vulnerability, please report it responsibly.

**Do not** open a public GitHub issue for security vulnerabilities.

Please report security issues to the project maintainer via:

- **GitHub**: Open a private advisory at [github.com/Rahulrachu/synapse-browser/security](https://github.com/Rahulrachu/synapse-browser/security)
- **Email**: Contact the maintainer directly

## What to Include

When reporting a vulnerability, please include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested fixes (optional)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix deployment:** As soon as possible, depending on severity

## Security Architecture

Synapse Browser implements the following security measures:

- **Context Isolation:** Enabled to prevent renderer process access to Node.js APIs
- **Sandbox:** Electron sandbox enabled for all WebContentsView instances
- **IPC Validation:** All IPC handlers validate input types
- **Preload Script:** Properly isolated with no direct Node.js exposure
- **No eval():** No use of eval() or unsafe script execution
- **API Keys:** Stored in local settings, never committed to source control
