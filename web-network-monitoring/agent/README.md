# Monitoring Agent

This Python agent reads devices from Firestore, pings each `ipAddress`, updates the device `status`, records `monitoringLogs`, and creates or resolves offline alerts.

## Setup

Create a Firebase service account key in Firebase Console, then use one of these options:

```bash
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json
```

Or:

```bash
set FIREBASE_SERVICE_ACCOUNT_JSON={...service account json...}
```

Install the Python dependency:

```bash
python -m pip install -r agent/requirements.txt
```

## Commands

Run one monitoring pass:

```bash
npm run agent:once
```

Run continuously:

```bash
npm run agent
```

Optional settings:

```bash
set AGENT_INTERVAL_MS=60000
set AGENT_INTERVAL_SECONDS=60
set AGENT_PING_TIMEOUT_MS=4000
```
