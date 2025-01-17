# Intercom Testing for AI Security

## Runtime Requirements

-   `Node.js 18.17.0^`
-   `npm 9.6.7^`

## Dependencies

-   `axios`
-   `sip.js 0.21.0^`
-   `zustand`

## Environment Variables

-   `VITE_SIP_IP`: SIP server IP address
-   `VITE_SIP_WSS_PORT`: SIP server WSS port
-   `VITE_SIP_PASSWORD`: SIP caller password
-   `VITE_WEB_SERVER_URL`: Web server URL

## Installation

```bash
npm install
```

## Start

```bash
npm run dev
```

If you want to expose your local ip:

```bash
npm run dev -- --host
```
