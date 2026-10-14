# React application and T-22 evidence

The sibling docs repository's spec-react-laravel folder defines the unchanged
HU-01 through HU-10. This frontend implements those operations using the existing
HTTP contract. Product text is Spanish; development documentation is English.

Use the sibling infrastructure start.ps1 to build and start the complete HTTPS
application at https://localhost:8443. Credentials are generated into the ignored
infrastructure .env file. Trust its exported .local/caddy-root.crt in the local
browser; no account or secret is embedded in this application.

The selected versions are recorded in package-lock.json. For a local build:

```sh
npm ci
npm run build
```

After starting infra, running the tool's demo.ps1 and starting the independent
page container, execute:

```sh
npx playwright install chromium
npm run test:e2e
```

The browser suite reads credentials from the ignored sibling infrastructure .env,
creates uniquely named test records through the UI, returns its test loan and
soft-deletes its test book. Member/user/loan records are retained as required by
the immutable/no-delete contract. Run against the local demonstration stack.
Traces are disabled so they cannot persist credential request bodies. Tokens
stay in application memory, never localStorage/sessionStorage or URLs.

Playwright accepts the private local certificate for UI tests. Independent
certificate-chain and hostname verification is performed by infra/verify.ps1
and the Node API utility with NODE_EXTRA_CA_CERTS, without disabling TLS checks.

The tests exercise admin and librarian roles, catalog/cover operations, members,
lending, returns, overdue items, reports and responsive layouts. The separate
public-page test blocks API access and records desktop/mobile screenshots.
See [executed T-22 evidence](evidence/T-22.md).
