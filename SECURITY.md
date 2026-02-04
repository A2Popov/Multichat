# Security Policy

## Supported Versions

This project is currently in initial development. Security updates are applied to the main branch.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Security Measures

### Implemented Security Features

1. **Authentication & Authorization**
   - JWT-based token authentication
   - Password hashing using bcrypt (4.0.1)
   - Admin-only protected endpoints
   - Token expiration (30 minutes default)

2. **Configuration Security**
   - Environment variables for sensitive configuration
   - `.env.example` files provided (no secrets in git)
   - Configurable SECRET_KEY for JWT signing

3. **Dependency Security**
   - All dependencies regularly checked for vulnerabilities
   - Using patched versions of all dependencies
   - GitHub Advisory Database integration

4. **Code Security**
   - CodeQL security scanning enabled
   - GitHub Actions with minimal required permissions
   - CORS properly configured
   - Input validation with Pydantic schemas

### Current Dependency Versions (Verified Secure)

**Backend (Python):**
- fastapi==0.109.1 (patched: ReDoS vulnerability)
- python-multipart==0.0.22 (patched: arbitrary file write, DoS, ReDoS)
- python-jose[cryptography]==3.4.0 (patched: algorithm confusion)
- bcrypt==4.0.1 (compatible version)
- uvicorn[standard]==0.27.0
- sqlalchemy==2.0.25
- pydantic==2.5.3
- pydantic-settings==2.1.0
- passlib==1.7.4

**Frontend (JavaScript):**
- react==18.2.0
- vite==5.0.11
- react-router-dom==6.21.0
- axios==1.6.5

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **Email**: Contact the repository owner
2. **GitHub Security Advisories**: Use the "Security" tab in the repository

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity (critical issues prioritized)

## Security Best Practices for Deployment

### Before Production Deployment

1. **Change Default Credentials**
   ```bash
   # Change admin password immediately!
   # Default: username=admin, password=admin
   ```

2. **Set Strong SECRET_KEY**
   ```bash
   # Generate a strong secret key
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **Use Environment Variables**
   ```bash
   # Create .env file (never commit!)
   SECRET_KEY=your-strong-secret-key-here
   DATABASE_URL=your-production-database-url
   ```

4. **Enable HTTPS**
   - Use a reverse proxy (nginx, traefik)
   - Obtain SSL/TLS certificates
   - Redirect HTTP to HTTPS

5. **Database Security**
   - Migrate from SQLite to PostgreSQL for production
   - Use strong database passwords
   - Enable database encryption
   - Regular backups

6. **Additional Hardening**
   - Enable rate limiting
   - Implement request size limits
   - Set up monitoring and alerting
   - Regular security audits
   - Keep dependencies updated

## Security Audit History

| Date       | Action                                    | Result                |
|------------|-------------------------------------------|-----------------------|
| 2026-02-04 | Initial CodeQL scan                       | 0 vulnerabilities     |
| 2026-02-04 | Dependency vulnerability scan             | 5 vulnerabilities found |
| 2026-02-04 | Updated fastapi, python-multipart, python-jose | All vulnerabilities fixed |
| 2026-02-04 | Final verification                        | 0 vulnerabilities     |

## Known Limitations

1. **Development Setup**
   - Default admin credentials (must be changed)
   - SQLite database (not suitable for production)
   - Debug mode enabled (disable in production)

2. **Future Enhancements**
   - Multi-factor authentication (MFA)
   - Rate limiting per user
   - API key rotation
   - Session management improvements
   - Audit logging

## Contact

For security concerns, please contact the repository maintainers through GitHub.
