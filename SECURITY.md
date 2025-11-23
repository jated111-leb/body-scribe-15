# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

### How to Report

1. **GitHub Security Advisories** (Preferred): Use GitHub's [private security reporting](https://github.com/jated111-leb/body-scribe-15/security/advisories/new) to create a private advisory
2. **Email**: If you prefer, contact the maintainers directly via the repository

### What to Include

Please provide:
- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity assessment
- Any suggested fixes or mitigations (optional)

### Response Timeline

- **Initial Response**: Within 48 hours of report submission
- **Status Update**: Weekly updates on investigation and remediation progress
- **Resolution**: We aim to address critical vulnerabilities within 7-14 days

## Supported Versions

We currently provide security updates for the main branch. Please ensure you're running the latest version.

## Security Best Practices

This project uses:
- **Lovable Cloud** for secure backend infrastructure and secret management
- **Row Level Security (RLS)** policies in the database
- **Environment variable isolation** (publishable keys only in frontend)
- **Automated dependency scanning** via Dependabot

## Disclosure Policy

We follow responsible disclosure practices. Please do not publicly disclose vulnerabilities until we've had a chance to address them and coordinate a release timeline.
