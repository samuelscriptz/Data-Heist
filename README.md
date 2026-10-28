# DATA HEIST 2026 // Participant Portal & Organizer Command Center

A secure, production-ready, dark-hacker themed web portal for **DATA HEIST**, a 90-minute college symposium challenge event held in the **Advanced Programming Lab**.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Web Audio API sound synthesis**, and **Supabase (PostgreSQL with Row Level Security)**.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev

# 3. Or build and run production server
npm run build
npm start
```
The application will launch on **`http://localhost:3000`**.

> **Zero-Configuration Local Demo:**  
> The portal includes a built-in state engine with 7 pre-seeded teams and 1 organizer account. It runs completely out-of-the-box even before connecting a Supabase cloud database.

---

## 🔑 Pre-Seeded Test Accounts

On the `/login` screen, use the quick-fill buttons or enter the credentials below:

| Role | Username | Password | Display Name | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Participant (Team 1)** | `cyber_hawks` | `hawk2026!` | Cyber Hawks | Solve challenges 1–10, request hints, view map if approved |
| **Participant (Team 2)** | `matrix_breakers` | `matrix99!` | Matrix Breakers | Solve challenges 1–10, request hints, view map if approved |
| **Participant (Team 3)** | `shadow_protocol` | `shadow123!` | Shadow Protocol | Solve challenges 1–10, request hints, view map if approved |
| **Participant (Team 4)** | `zero_day_squad` | `zeroday!` | Zero Day Squad | Solve challenges 1–10, request hints, view map if approved |
| **Participant (Team 5)** | `byte_force` | `byteforce!` | Byte Force | Solve challenges 1–10, request hints, view map if approved |
| **Participant (Team 6)** | `crypto_ninjas` | `ninja2026!` | Crypto Ninjas | Solve challenges 1–10, request hints, view map if approved |
| **Participant (Team 7)** | `glitch_hunters` | `glitch!` | Glitch Hunters | Solve challenges 1–10, request hints, view map if approved |
| **Organizer (Admin)** | `admin` | `admin2026!` | Lead Proctor | Access `/organizer`, approve/reject finishes, pause/reset event, inspect map |

---

## 🎯 Architecture & Features

### 1. Participant Experience (`/dashboard`)
- **Dark Hacker-Terminal Aesthetic:** Monospace typography (Geist Mono), CRT scanlines overlay, neon accents (`#00ff9d` cyber green, `#00f0ff` electric cyan, `#ffb700` amber, `#ff0055` glitch red), and animated falling matrix canvas.
- **Authoritative 90-Minute Countdown:** Synchronized against the server clock every 15 seconds to eliminate client-side clock tampering. Visual warning trigger when < 15 minutes remain.
- **10-Node Circuit Progression Map:** Interactive circuit diagram reflecting `locked`, `current`, and `completed` states.
- **Focused Challenge Terminal:**
  - Classified intel briefing, category, difficulty, and points badges.
  - Interactive payload inspector (Base64, hex dumps, memory maps, packet captures, disassembled shellcode) with quick clipboard copy.
  - Terminal-style command prompt input (`team@apl:~$ auth <payload>`).
  - Tactical hint drawer with explicit 25-point deduction penalty confirmation.
  - Submission cooldown rate limiter (2-second minimum interval, 15 attempts/min limit).
- **Audio Synthesizer Engine (Web Audio API):**
  - 100% self-contained — zero external audio assets that could 404 or fail to load.
  - Synthesizes cyber bleeps, keystroke clicks, ascending solve chimes, failure buzzes, alarm pulses, and victory fanfare.
  - Clear header audio toggle (`SFX: ACTIVE` / `SFX: MUTED`) with `localStorage` persistence. Defaults to non-autoplay.

### 2. The 10 Challenges Data Model
1. **Node 1: Breach The Gateway** (Cipher & Decoding) - Decode RFC 4648 Base64 stream -> `ACCESS_GRANTED_PORT_8080`
2. **Node 2: The Caesar Infiltration** (Cipher & Decoding) - Julius Caesar ROT13 shift cipher -> `FIREWALL_OVERRIDE_ACTIVE`
3. **Node 3: Kernel Memory Dump** (Reverse Engineering) - 64-byte hex memory dump offset 0x20 -> `0x7F8E4A9C`
4. **Node 4: Steganography Signal** (Steganography) - Hex-paired ASCII nibbles in HTTP headers -> `QUANTUM_ENTANGLEMENT`
5. **Node 5: Packet Sniffer (CTF)** (CTF Flag) - URL-encoded query string inside Wireshark capture -> `HEIST{p4ck3t_sn1ff3r_d3t3ct3d}`
6. **Node 6: SQL Injection Mystery** (Web & Database) - Tautological query bypass session token -> `ADMIN_BYPASS_TOKEN_404`
7. **Node 7: Polyalphabetic Enigma** (Cipher & Decoding) - Vigenère square cipher with keyword `HEIST` -> `CIPHER_MACHINE_SYNCHRONIZED`
8. **Node 8: Binary Hash Cracker** (Cryptographic Hash) - Unsalted MD5 shadow hash (`cybercore` + `26`) -> `cybercore26`
9. **Node 9: Stack Overflow Shellcode (CTF)** (CTF Flag) - x86-64 return frame disassembly -> `HEIST{st4ck_sm4sh1ng_succ3ss}`
10. **Node 10: Master Vault Override** (Logic & Parity) - Synthesizes alpha override parity tokens -> `OMEGA_OVERRIDE_ROOT_VERIFIED`

### 3. Secure Challenge 10 Finish & First-6 Venue Map Allocation
When a team solves Challenge 10:
1. **Server Clock Lock:** An authoritative ISO timestamp is locked server-side (`completed_at = now()`).
2. **Review Gate:** The team status transitions to `pending` review. The venue map is **strictly withheld**.
3. **Proctor Verification:** An authenticated organizer reviews the team's audit trail on `/organizer` and clicks **Approve** or **Reject**.
4. **Race-Safe Concurrency Lock:**
   - PostgreSQL stored procedure `approve_team_completion()` uses row-locking (`FOR UPDATE`) to atomically check current approved count.
   - If count < 6: `map_eligible = TRUE`, `finish_rank = count + 1`.
   - If count >= 6: `map_eligible = FALSE`, `finish_rank = count + 1`.
   - Simultaneous clicks cannot allocate more than 6 slots.
5. **Strict Venue Map Endpoint (`/api/venue-map`):**
   - The venue map is **NEVER** placed in `public/` or client bundles.
   - Every request to `/api/venue-map` enforces 3 server-side validation checks:
     1. Authenticated team session.
     2. Team has solved Challenge 10 (`is_completed = true`).
     3. Organizer `review_status = 'approved'` **AND** `map_eligible = true` (rank <= 6).
   - If any check fails, returns `403 Forbidden`.
   - When verified, returns the vector blueprint of Lab 304, secret extraction keycode (`DH-8842-OMEGA-X`), physical rack coordinates, and proctor checklist.

### 4. Organizer Command Center (`/organizer`)
- **Role-Based Access Control (RBAC):** Server-side verification restricts the route to users with `role === 'organizer'`.
- **Live 6-Slot Quota Tracker:** Real-time indicator of claimed venue map slots (e.g. `0 / 6 CLAIMED`).
- **Challenge 10 Review Queue:** Displays pending finishers with authoritative timestamps and one-click `APPROVE` / `REJECT` actions.
- **Participating Teams Monitor:** Grid view of all teams, their current unlocked node, total attempts, score, and solve status.
- **Live Submission Audit Trail:** Real-time log of the last 30 answer attempts across all teams with timestamps and evaluated results.
- **Event Controls:** Pause countdown, resume countdown, or reset all team progress for a fresh event run.
- **Map Blueprint Preview:** Allows proctors to inspect the classified venue map without altering participant states.

### 5. Live Leaderboard (`/leaderboard`)
- Publicly accessible standings table sorted by:
  1. Highest challenges solved.
  2. Earliest solve timestamp (server-verified).
  3. Fewest attempts.
- Highlights the top-6 qualified teams with a `TOP 6 MAP` badge.
- Only displays team names and scores — no participant personal details or emails are leaked.
- Auto-refreshes every 10 seconds with a manual refresh button.

---

## 🛡️ Security Implementation Details

1. **Zero Client-Side Trust:**
   - Plaintext answers, answer hashes, and regex patterns are stored in `SERVER_CHALLENGES` and the Supabase database. They are never sent to the browser in API responses or HTML components.
   - The client only receives sanitized challenge definitions (`id`, `title`, `description`, `clue`, `artifactContent`, `answerFormatHint`).
2. **Sequential Bypass Prevention:**
   - Server-side route handler `/api/challenges/submit` verifies `challengeId === team.currentChallengeIndex`.
   - Any crafted API request attempting to submit for Challenge 5 while on Challenge 2 is rejected with `400 Invalid challenge sequence`.
3. **Anti-Brute Force Rate Limiting:**
   - Teams are restricted to 1 submission every 2 seconds, and a maximum of 15 attempts per minute.
   - Exceeding the threshold returns `429 Rate Limit Triggered` with an active cooldown timer.
4. **Session Security:**
   - Authenticated sessions are stored in `httpOnly`, `sameSite: 'lax'` cookies with a 6-hour TTL.
   - Tokens cannot be accessed via JavaScript (`document.cookie`), mitigating XSS session hijacking.

---

## 🗄️ Supabase Setup & Production Deployment

### 1. Database Setup in Supabase
1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the migration script in:
   `supabase/migrations/20260228_initial_schema.sql`
4. Run the seed data script in:
   `supabase/seed.sql`
5. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from **Project Settings > API**.

### 2. Configure Environment Variables
Create `.env.local` (or configure in Vercel project settings):
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET_KEY=your_secure_random_key_min_32_chars
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 3. Deploy to Vercel
```bash
# Deploy with Vercel CLI
npx vercel

# Or push to GitHub and import the repository into your Vercel Dashboard
```
Make sure to add the environment variables from `.env.local` into the **Environment Variables** section in your Vercel project settings.

---

## 📋 Organizer Event Day Checklist

1. **Configure Real Event Content (Optional):**
   - Replace challenge descriptions, artifacts, or answers in `src/lib/challenges-data.ts` or directly in the Supabase `challenges` table.
2. **Set Venue Map Coordinates:**
   - If the symposium venue changes, update the room name or SVG coordinates in `src/lib/db-store.ts` (`getVenueMapForTeam`).
3. **Start the Event:**
   - Log into `/organizer` with `admin` / `admin2026!`.
   - If needed, click **RESET** right before participants begin to ensure a clean 90-minute countdown starting at 00:00.
4. **Review Finishers:**
   - Keep the `/organizer` tab open during the event.
   - When teams finish Challenge 10, verify their integrity and click **APPROVE**.
   - The first 6 approved teams will automatically receive their venue map and extraction codes.
