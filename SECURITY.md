# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.4+  | :white_check_mark: |
| 2.0.3   | :x: (XSS vulnerabilities) |
| < 2.0.0 | :x:                |

## Security Features

### XSS Protection

Version 2.0.4+ includes comprehensive XSS (Cross-Site Scripting) protection:

- **DOMPurify Integration**: All user-generated HTML content is sanitized using DOMPurify
- **Safe DOM Manipulation**: SecurityUtils module provides safe HTML rendering
- **Column Render Protection**: Custom render functions are automatically sanitized
- **Export Protection**: CSV formula injection prevention

### Content Security Policy (CSP)

For enhanced security, we recommend implementing a Content Security Policy in your application:

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

### CSV Formula Injection Protection

The library automatically escapes dangerous characters in CSV exports to prevent formula injection attacks:

```javascript
// Automatically escapes formulas starting with: = + - @ \t \r
const data = [
  { name: '=1+1' } // Exported as '=1+1 (safe)
];

table.exportToCSV(data, columns);
```

### Input Validation

The library includes validation for:

- **HTML Sanitization**: All HTML content is sanitized
- **URL Validation**: URLs in href/src attributes are validated
- **Length Limits**: Input length validation to prevent DoS attacks
- **XSS Pattern Detection**: Automatic detection of potential XSS patterns

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: [security@your-project.com]

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include:

- Type of issue (e.g., XSS, SQL injection, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Best Practices for Users

### 1. Keep Dependencies Updated

Always use the latest version of the library and DOMPurify:

```bash
npm update vanillajs-excelike-table
npm audit fix
```

### 2. Sanitize Custom Render Functions

If you provide custom render functions, ensure you don't bypass built-in sanitization:

```javascript
// ✅ SAFE - Library sanitizes automatically
columns: [{
  render: (value) => `<strong>${value}</strong>`
}]

// ⚠️ UNSAFE - Don't use dangerouslySetInnerHTML equivalent
columns: [{
  render: (value) => {
    const div = document.createElement('div');
    div.innerHTML = value; // UNSAFE if value is user-controlled
    return div;
  }
}]
```

### 3. Validate User Input

Always validate and sanitize user input before passing to the table:

```javascript
// ✅ SAFE
const userInput = sanitizeUserInput(rawInput);
table.updateData([{ name: userInput }]);

// ⚠️ UNSAFE
table.updateData([{ name: rawInputFromUser }]);
```

### 4. Implement CSP Headers

Configure your web server to send CSP headers:

**Apache:**
```apache
Header set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
```

**Nginx:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";
```

**Node.js/Express:**
```javascript
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");
  next();
});
```

### 5. Use HTTPS

Always serve your application over HTTPS to prevent man-in-the-middle attacks.

### 6. Regular Security Audits

Run regular security audits:

```bash
npm audit
npm audit fix
```

### 7. Plugin Security

Be cautious when using third-party plugins:

```javascript
// ✅ Verify plugin source
import { PluginName } from 'verified-source';

// ⚠️ Review plugin code before use
table.registerPlugin(untrustedPlugin); // Review first!
```

## Security Changelog

### Version 2.0.4 (2025-10-08)

**Security Fixes:**
- ✅ Added DOMPurify integration for XSS protection
- ✅ Fixed XSS vulnerability in column render functions (src/virtual-scroll.js)
- ✅ Fixed XSS vulnerability in filter dropdowns (src/dom-utils.js)
- ✅ Fixed CSV formula injection in exports (src/export-module.js)
- ✅ Added SecurityUtils module with comprehensive sanitization
- ✅ Added CSP headers guidance
- ✅ Added input validation and length limits

**Impact:**
- **HIGH**: Prevents XSS attacks via user-generated content
- **HIGH**: Prevents CSV formula injection in Excel/LibreOffice
- **MEDIUM**: Improved overall security posture

### Version 2.0.3 and Earlier

⚠️ **Known Vulnerabilities:**
- XSS via column render functions (CVSS 8.0)
- XSS via filter dropdowns (CVSS 7.5)
- CSV formula injection (CVSS 7.0)
- Insufficient input sanitization (CVSS 6.0)

**Recommendation:** Upgrade to version 2.0.4 or later immediately.

## Security Testing

The library includes security tests in the test suite:

```bash
npm run test:security
```

Security test coverage:
- XSS injection attempts
- CSV formula injection
- HTML sanitization
- URL validation
- Input length limits

## Known Limitations

1. **Inline Styles**: CSP requires `'unsafe-inline'` for `style-src` due to dynamic styling. This is a known limitation that balances functionality with security.

2. **Plugin System**: Third-party plugins may bypass security measures. Always review plugin code before use.

3. **Custom Render Functions**: If you return DOM elements from render functions (not HTML strings), you're responsible for sanitization.

## Security Resources

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)

## Responsible Disclosure

We practice responsible disclosure and will:

1. Confirm receipt of your report within 48 hours
2. Provide an estimated timeline for a fix within 7 days
3. Notify you when the fix is released
4. Credit you in the security changelog (if desired)
5. Coordinate public disclosure timing with you

Thank you for helping keep vanillajs-excelike-table secure!
