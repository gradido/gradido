# Deployment for bare metal servers
This setup is designed for **bare metal servers**, offering maximum performance and reliability for Gradido deployments. However, it can also work on **virtual servers (VPS)** – if properly configured.

## 🧠 Memory Considerations on VServers

We have observed that some VServer providers apply **aggressive virtual memory constraints** or overcommit strategies that may cause **random crashes** of Node.js processes – even when total RAM appears sufficient.

### Important Notes:

- A single Node.js process may **allocate 10–12 GB of virtual memory** (VIRT), even if **real memory usage (RES)** stays below 200 MB.
- Some VPS environments **panic or kill processes** when virtual memory allocation exceeds certain invisible thresholds.

## 🛡️ Rate Limiting (API Protection)

This deployment includes built-in **rate limiting** for public-facing endpoints to prevent abuse and denial-of-service attacks.

### 🔒 NGINX Rate & Connection Limits Overview

| Path                        | Zone     | Rate Limit     | Burst | Max Connections | Notes                          |
|----------------------------|----------|----------------|-------|------------------|--------------------------------|
| `/`                        | frontend | 15 requests/s  | 150   | 60               | Public frontend                |
| `/admin`                   | frontend | 15 requests/s  | 30    | 20               | Admin frontend                 |
| `/graphql`                 | backend  | 20 requests/s  | 40    | 20               | Main backend GraphQL API       |
| `/hook`                    | backend  | 20 requests/s  | 20    | 20               | Internal backend webhooks      |
| `/hooks/`                  | backend  | 20 requests/s  | 20    | 20               | Reverse proxy for webhooks     |
| `/api/<version>` | api   | 30 requests/s  | 60    | 30               | Federation GraphQL API            |

- `<version>`: placeholder for federation api version
- All zones use `$binary_remote_addr` for client identification.
- `nodelay` ensures burst requests are not delayed (they are either accepted or rejected).
- Global connection zone: `limit_conn_zone $binary_remote_addr zone=addr:10m;`

This setup helps protect public and internal interfaces from abuse, while ensuring smooth parallel access during high load periods (e.g., UI builds or cluster sync).

These limits work like a traffic cop at each route:
- **Rate limits** (`limit_req`) define how many requests per second a single client can send.
- **Burst values** allow short spikes without blocking – like a temporary buffer.
- **Connection limits** (`limit_conn`) cap how many concurrent connections a single IP can keep open.

Each route (frontend, backend, API, etc.) has its own configuration depending on its expected traffic pattern and sensitivity. For example:
- The public frontend allows higher bursts (many assets load at once).
- The GraphQL backend and admin interfaces are more tightly controlled.

This ensures fairness, avoids accidental DoS scenarios, and keeps overall latency low, even under high usage.


