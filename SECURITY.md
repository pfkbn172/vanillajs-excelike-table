# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.2.0+  | :white_check_mark: |
| 2.0.4-2.1.x | :x: (Bundle bloat, removed XSS protection) |
| < 2.0.4 | :x:                |

## Security Philosophy

**This library does NOT provide built-in XSS protection.** Following industry standards (AG-Grid, TanStack Table, DataTables, Handsontable), security is the responsibility of the application layer.

### Why No Built-in XSS Protection?

1. **Industry Standard**: Major table libraries don't include XSS sanitization
2. **Bundle Size**: Reduces bundle size by ~45KB (31% reduction)
3. **Flexibility**: Users can choose their preferred sanitization approach
4. **Application Responsibility**: Security should be handled at the application level

## Security Features

### CSV Formula Injection Protection

The library automatically escapes dangerous characters in CSV exports to prevent formula injection attacks:

```javascript
// Automatically escapes formulas starting with: = + - @ \t \r
const data = [
  { name: '=1+1' } // Exported as '=1+1 (safe)
];

table.exportToCSV(data, columns);
```

### DoS Protection

The library includes validation for table size limits to prevent Denial of Service attacks:

- **Max Rows**: 100,000 rows
- **Max Columns**: 100 columns
- **Max Cell Size**: 10,000 characters
- **Max Total Size**: 50MB

## Security Best Practices for Users

### 1. Sanitize User Input

**You MUST sanitize user input before rendering HTML in the table.**

```javascript
// Option 1: Use DOMPurify (recommended)
import DOMPurify from 'dompurify';

const table = new ExceLikeTable('#container', {
  data: myData,
  columns: [{
    key: 'description',
    title: 'Description',
    dataIndex: 'description',
    render: (value) => DOMPurify.sanitize(value)
  }]
});

// Option 2: Use textContent (safest)
columns: [{
  render: (value) => {
    const span = document.createElement('span');
    span.textContent = value; // Automatically escapes HTML
    return span;
  }
}]

// ⚠️ UNSAFE - Never use unsanitized user input
columns: [{
  render: (userInput) => `<div>${userInput}</div>` // DANGEROUS!
}]
```

### 2. Implement Content Security Policy (CSP)

For enhanced security, implement a Content Security Policy in your application:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

#### CSP Directives Explained

- `default-src 'self'` - Only allow resources from same origin
- `script-src 'self'` - Only allow scripts from same origin
- `style-src 'self' 'unsafe-inline'` - Allow inline styles (required for dynamic styling)
- `img-src 'self' data: https:` - Allow images from same origin, data URLs, and HTTPS
- `frame-ancestors 'none'` - Prevent clickjacking attacks
- `base-uri 'self'` - Restrict base tag to same origin
- `form-action 'self'` - Only allow form submissions to same origin

### 3. Keep Dependencies Updated

Always use the latest version of the library:

```bash
npm update vanillajs-excelike-table
npm audit fix
```

### 4. Use HTTPS

Always serve your application over HTTPS to prevent man-in-the-middle attacks.

### 5. Regular Security Audits

Run regular security audits:

```bash
npm audit
npm audit fix
```

### 6. Plugin Security

Be cautious when using third-party plugins:

```javascript
// ✅ Verify plugin source
import { PluginName } from 'verified-source';

// ⚠️ Review plugin code before use
table.registerPlugin(untrustedPlugin); // Review first!
```

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: [security@your-project.com]

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include:

- Type of issue (e.g., XSS, CSV injection, DoS, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Changelog

### Version 2.2.0 (2025-10-13)

**Breaking Changes:**
- ❌ **Removed built-in XSS protection** - Applications must sanitize user input
- ❌ **Removed DOMPurify dependency** - Bundle size reduced by 31%
- ✅ **Kept CSV formula injection protection**
- ✅ **Kept DoS protection (table size limits)**

**Migration Guide:**

```javascript
// Before (v2.1.x): Automatic sanitization
render: (value) => `<span>${value}</span>` // Was automatically sanitized

// After (v2.2.0+): Manual sanitization required
import DOMPurify from 'dompurify';
render: (value) => DOMPurify.sanitize(`<span>${value}</span>`)
```

**Impact:**
- ⚠️ **Breaking**: Applications must implement their own XSS protection
- ✅ **Positive**: Bundle size reduced by ~45KB (31% reduction)
- ✅ **Positive**: Follows industry standards (AG-Grid, TanStack Table, etc.)

### Version 2.0.4 - 2.1.x (2025-10-08)

**Security Features (Removed in v2.2.0):**
- ~~DOMPurify integration for XSS protection~~
- ~~Automatic HTML sanitization~~
- ~~Built-in XSS prevention~~

**Security Features (Still Present):**
- ✅ CSV formula injection protection
- ✅ DoS protection (table size limits)

### Version 2.0.3 and Earlier

⚠️ **Known Vulnerabilities:**
- No CSV formula injection protection
- No DoS protection

**Recommendation:** Upgrade to version 2.2.0 or later.

## Security Testing

The library includes security tests in the test suite:

```bash
npm test
```

Security test coverage:
- CSV formula injection protection
- DoS protection (table size limits)
- Input validation

## Known Limitations

1. **No Built-in XSS Protection**: Applications must implement their own XSS sanitization
2. **Inline Styles**: CSP requires `'unsafe-inline'` for `style-src` due to dynamic styling
3. **Plugin System**: Third-party plugins may bypass security measures. Always review plugin code before use
4. **Custom Render Functions**: You are responsible for sanitizing all HTML content returned from render functions

## Security Resources

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify) - Recommended XSS sanitization library
- [CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)

## Responsible Disclosure

We practice responsible disclosure and will:

1. Confirm receipt of your report within 48 hours
2. Provide an estimated timeline for a fix within 7 days
3. Notify you when the fix is released
4. Credit you in the security changelog (if desired)
5. Coordinate public disclosure timing with you

Thank you for helping keep vanillajs-excelike-table secure!
