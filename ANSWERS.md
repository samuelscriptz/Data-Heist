# OPERATION DATA HEIST — MASTER ANSWER KEY & CHALLENGE SOLUTIONS

> **COLLEGE SYMPOSIUM 2026 // ADVANCED PROGRAMMING LAB**  
> **Confidential Document:** For Organizer, Proctor, and Evaluator Reference Only.  
> **Challenge Composition:** 4 Decrypting Questions, 4 Puzzle Questions, 2 CTF Questions.  
> **Duration:** 20 Minutes (Server-Authoritative Clock).  
> **Rule:** All participant answers must be submitted in **UPPERCASE**.  
> **Hint Cost:** Exactly **50%** of each challenge's point value.

---

## 🏆 Master Quick-Reference Answer Key

| Node # | Challenge Title | Category | Difficulty | Points | Hint Cost (50%) | Exact Accepted Answer (UPPERCASE) |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **01** | **Gateway Cipher Stream** | **Decrypting** | Easy | 100 | **50 PTS** | `HEIST_TERMINAL_OVERRIDE` |
| **02** | **The Tri-Word Association** | **Puzzle** | Easy | 150 | **75 PTS** | `BINARY` |
| **03** | **The Caesar Shift Alert** | **Decrypting** | Medium | 200 | **100 PTS** | `FIREWALL_BREACH_DETECTED` |
| **04** | **The Three Server Rooms** | **Puzzle** | Medium | 250 | **125 PTS** | `SERVER_BETA` *(or `BETA`)* |
| **05** | **HTTP Header Token Infiltration** | **CTF Flag** | Medium | 300 | **150 PTS** | `FLAG{WEB_HEADER_EXTRACTED}` |
| **06** | **Raw Hex Byte Stream** | **Decrypting** | Medium | 300 | **150 PTS** | `SECURE_MAINFRAME` |
| **07** | **The Scrambled Diagnostic Tool** | **Puzzle** | Hard | 350 | **175 PTS** | `TRACEROUTE` |
| **08** | **The Polyalphabetic Directive** | **Decrypting** | Hard | 400 | **200 PTS** | `DATA_HEIST_VICTORY` |
| **09** | **Network Packet Telemetry Stream** | **CTF Flag** | Expert | 450 | **225 PTS** | `FLAG{NETWORK_PACKET_HEX}` |
| **10** | **The Master Enclave Riddle** | **Puzzle** | Expert | 500 | **250 PTS** | `PASSWORD` |

---

## 🗺️ Physical Venue Map (3-Floor Block Layout & Clearance Gate)

Upon completing Node #10, the team is set to **`reviewStatus: 'pending'`** and venue maps remain **locked**.  
**Only after the Organizer approves the team in the Organizer Console (`/organizer`)** will the team receive clearance to open the 3-floor blueprints.

* **Level 01 (Ground Floor - `/floor 1.jpeg`):**
  * *Location:* Main Entrance, Reception Desk, and Primary Network Junction.
  * *Objective:* Physical Clue #1 hidden inside the main junction locker.
* **Level 02 (Mid Floor - `/floor 2.jpeg`):**
  * *Location:* Central Laboratory Corridor & Student Workstation Bays.
  * *Objective:* Physical Clue #2 hidden inside the lab server cabinet.
* **Level 03 (Top Enclave - `/floor 3.jpeg`):**
  * *Location:* Advanced Programming Lab (Lab 304) & Master Enclave.
  * *Objective:* Target Dropbox #3B containing the physical **Data Core Trophy**.
  * *Extraction Keycode:* `DH-8842-OMEGA-[Rank]` (e.g. `DH-8842-OMEGA-1`)

---

## 🔍 Detailed Node Solutions & Walkthroughs

### Node 01: Gateway Cipher Stream
* **Category:** Decrypting (1 of 4)
* **Difficulty:** Easy
* **Points:** 100 | **Hint Cost:** 50 PTS
* **Format:** `UPPERCASE string with underscores`
* **Accepted Answer:** `HEIST_TERMINAL_OVERRIDE`
* **Provided Artifact:**
  ```text
  SEVJU1RfVEVSTUlOQUxfT1ZFUlJJREU=
  ```
* **Hint (Methodology Only):** The payload is serialized using standard RFC 4648 Base64 encoding. Use a Base64 decoding algorithm, terminal utility (`base64 -d`), or online cryptanalytic tool.
* **Solution Walkthrough:**
  Decoding the Base64 string:
  ```bash
  echo "SEVJU1RfVEVSTUlOQUxfT1ZFUlJJREU=" | base64 -d
  # Output: HEIST_TERMINAL_OVERRIDE
  ```

---

### Node 02: The Tri-Word Association
* **Category:** Puzzle (1 of 4)
* **Difficulty:** Easy
* **Points:** 150 | **Hint Cost:** 75 PTS
* **Format:** `Single UPPERCASE word (6 letters)`
* **Accepted Answer:** `BINARY`
* **Provided Artifact:**
  ```text
  [SECURITY VERIFICATION PUZZLE: 6-LETTER COMPUTING TERM]
  1. [ ______ ] Search  -> The efficient divide-and-conquer logarithmic lookup algorithm.
  2. [ ______ ] Tree    -> A fundamental hierarchical data structure with at most 2 child nodes.
  3. [ ______ ] Digits  -> The fundamental base-2 0s and 1s processed by computer processors.
  ```
* **Hint (Methodology Only):** Think of the mathematical number system with radix 2 that serves as the root foundation of all digital electronics and computing architectures.
* **Solution Walkthrough:**
  The 6-letter term that completes all three phrases is **BINARY**:
  1. **Binary Search**
  2. **Binary Tree**
  3. **Binary Digits**

---

### Node 03: The Caesar Shift Alert
* **Category:** Decrypting (2 of 4)
* **Difficulty:** Medium
* **Points:** 200 | **Hint Cost:** 100 PTS
* **Format:** `UPPERCASE string with underscores`
* **Accepted Answer:** `FIREWALL_BREACH_DETECTED`
* **Provided Artifact:**
  ```text
  [02:14:09] INTRUSION-DAEMON: SECURITY ANOMALY DETECTED
  [02:14:10] ENCRYPTION-TYPE: ROT13 SUBSTITUTION
  [02:14:11] INTERCEPTED_BUFFER: SVERJNYY_OERNPU_QRGRPGRQ
  [02:14:12] ACTION: REVERT ROT13 SHIFT TO RETRIEVE ALERT
  ```
* **Hint (Methodology Only):** The ciphertext uses a ROT-13 symmetric rotation (each letter shifted by 13 positions in the 26-letter Latin alphabet). Applying the 13-letter shift once more restores the plaintext.
* **Solution Walkthrough:**
  Rotating `SVERJNYY_OERNPU_QRGRPGRQ` by 13 positions restores:
  `FIREWALL_BREACH_DETECTED`.

---

### Node 04: The Three Server Rooms
* **Category:** Puzzle (2 of 4)
* **Difficulty:** Medium
* **Points:** 250 | **Hint Cost:** 125 PTS
* **Format:** `UPPERCASE server name (e.g., ALPHA, BETA, or GAMMA)`
* **Accepted Answer:** `SERVER_BETA` *(or `BETA`)*
* **Provided Artifact:**
  ```text
  FACILITY ROOMS: Room 101 | Room 102 | Room 103
  SERVERS       : Server Alpha | Server Beta | Server Gamma
  STATUS LIGHTS : Green | Blue | Red

  DISCLOSED AUDIT FACTS:
  1. Server Alpha is NOT in Room 101, and its status light glows GREEN.
  2. The server located in Room 102 has a BLUE status light.
  3. Server Gamma is physically located in Room 103.

  QUESTION: Which server is located in Room 101?
  ```
* **Hint (Methodology Only):** Use deductive reasoning: Fact 3 fixes Gamma in Room 103. Therefore only Alpha and Beta remain for Rooms 101 and 102. Check Fact 1 regarding where Alpha cannot be situated.
* **Solution Walkthrough:**
  - Fact 3: Gamma is in Room 103.
  - Remaining rooms for Alpha & Beta: Room 101 and Room 102.
  - Fact 1: Alpha is NOT in Room 101.
  - Therefore, Alpha must be in Room 102.
  - Process of elimination leaves **Server Beta** in Room 101.
  - Answer: `SERVER_BETA` or `BETA`.

---

### Node 05: HTTP Header Token Infiltration
* **Category:** CTF Flag (1 of 2)
* **Difficulty:** Medium
* **Points:** 300 | **Hint Cost:** 150 PTS
* **Format:** `CTF Flag format FLAG{...} in UPPERCASE`
* **Accepted Answer:** `FLAG{WEB_HEADER_EXTRACTED}`
* **Provided Artifact:**
  ```http
  HTTP/1.1 200 OK
  Date: Sun, 09 Nov 2026 08:30:00 GMT
  Server: Apache/2.4.52 (Ubuntu)
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-Staging-Token: RkxBR3tXRUJfSEVBREVSX0VYVFJBQ1RFRH0=
  Content-Type: text/html; charset=UTF-8
  Content-Length: 312
  ```
* **Hint (Methodology Only):** Locate the custom HTTP header beginning with `X-`. The token value is encoded in RFC 4648 Base64. Extract the token and decode it using a standard Base64 decoder.
* **Solution Walkthrough:**
  1. Inspect the headers to find `X-Staging-Token: RkxBR3tXRUJfSEVBREVSX0VYVFJBQ1RFRH0=`.
  2. Base64 decode:
     ```bash
     echo "RkxBR3tXRUJfSEVBREVSX0VYVFJBQ1RFRH0=" | base64 -d
     # Output: FLAG{WEB_HEADER_EXTRACTED}
     ```

---

### Node 06: Raw Hex Byte Stream
* **Category:** Decrypting (3 of 4)
* **Difficulty:** Medium
* **Points:** 300 | **Hint Cost:** 150 PTS
* **Format:** `TWO UPPERCASE words separated by underscore`
* **Accepted Answer:** `SECURE_MAINFRAME`
* **Provided Artifact:**
  ```text
  53 45 43 55 52 45 5F 4D 41 49 4E 46 52 41 4D 45
  ```
* **Hint (Methodology Only):** Each two-digit hex pair represents one ASCII character in hexadecimal (base 16). For example, 0x41 is 'A', 0x5F is '_'. Convert each hex byte into its ASCII character equivalent.
* **Solution Walkthrough:**
  - 53 = 'S', 45 = 'E', 43 = 'C', 55 = 'U', 52 = 'R', 45 = 'E' -> `SECURE`
  - 5F = '_'
  - 4D = 'M', 41 = 'A', 49 = 'I', 4E = 'N', 46 = 'F', 52 = 'R', 41 = 'A', 4D = 'M', 45 = 'E' -> `MAINFRAME`
  - Output: `SECURE_MAINFRAME`

---

### Node 07: The Scrambled Diagnostic Tool
* **Category:** Puzzle (3 of 4)
* **Difficulty:** Hard
* **Points:** 350 | **Hint Cost:** 175 PTS
* **Format:** `Single UPPERCASE command name (10 letters)`
* **Accepted Answer:** `TRACEROUTE`
* **Provided Artifact:**
  ```text
  [DIAGNOSTIC CRASH REPORT - IDENTIFIER BUFFER CORRUPTED]
  ANAGRAM SCRAMBLED LETTERS:
  E - R - T - O - A - U - C - E - R - T

  SYSTEM PARAMETERS:
  - Word Length  : Exactly 10 Letters
  - Category     : Network Diagnostic Utility
  - Action       : Traces hops and latency to remote hosts
  ```
* **Hint (Methodology Only):** Unscramble the letters to form the standard Unix/Linux networking tool that sends packets with incrementing TTL (Time-To-Live) values to map the path to a server.
* **Solution Walkthrough:**
  Unscrambling `E R T O A U C E R T` produces `TRACEROUTE`.

---

### Node 08: The Polyalphabetic Directive
* **Category:** Decrypting (4 of 4)
* **Difficulty:** Hard
* **Points:** 400 | **Hint Cost:** 200 PTS
* **Format:** `THREE UPPERCASE words separated by underscores`
* **Accepted Answer:** `DATA_HEIST_VICTORY`
* **Provided Artifact:**
  ```text
  CIPHERTEXT : KEBS_ALMAL_OPGBGKF
  KEYWORD    : HEIST
  ALGORITHM  : VIGENERE (A=0, B=1, ... Z=25)
  ```
* **Hint (Methodology Only):** This polyalphabetic substitution shifts each letter backwards according to the corresponding letter of the repeated key 'HEISTHEIST...'. Align each ciphertext character with the repeated key and reverse the Caesar shift.
* **Solution Walkthrough:**
  Align ciphertext with repeated key `HEISTHEISTHEIST`:
  - `KEBS` - `HEIS` -> `DATA`
  - `_` preserved
  - `ALMAL` - `THEIS` -> `HEIST`
  - `_` preserved
  - `OPGBGKF` - `THEISTH` -> `VICTORY`
  - Output: `DATA_HEIST_VICTORY`

---

### Node 09: Network Packet Telemetry Stream
* **Category:** CTF Flag (2 of 2)
* **Difficulty:** Expert
* **Points:** 450 | **Hint Cost:** 225 PTS
* **Format:** `CTF Flag format FLAG{...} in UPPERCASE`
* **Accepted Answer:** `FLAG{NETWORK_PACKET_HEX}`
* **Provided Artifact:**
  ```http
  WIRESHARK PACKET DISSECTION [Frame #8104]
  ----------------------------------------------------------------------
  Frame Length: 214 bytes on wire
  Transmission Control Protocol: Src Port: 54102, Dst Port: 80
  Hypertext Transfer Protocol:
    GET /telemetry/beacon?stream=464C41477B4E4554574F524B5F5041434B45545F4845587D HTTP/1.1
    Host: c2-collector.internal.heist
    User-Agent: DataHeist-Agent/4.1
    Accept: */*
    Connection: close
  ----------------------------------------------------------------------
  ```
* **Hint (Methodology Only):** The 'stream' parameter in the GET request contains ASCII characters represented as two-digit hexadecimal values. Group the hex string into pairs of two (e.g. 46 4C 41...) and translate each byte into its ASCII character.
* **Solution Walkthrough:**
  Extract hex pairs from `464C41477B4E4554574F524B5F5041434B45545F4845587D`:
  `46`='F', `4C`='L', `41`='A', `47`='G', `7B`='{', `4E`='N', `45`='E', `54`='T', `57`='W', `4F`='O', `52`='R', `4B`='K', `5F`='_', `50`='P', `41`='A', `43`='C', `4B`='K', `45`='E', `54`='T', `5F`='_', `48`='H', `45`='E', `58`='X', `7D`='}'
  Output: `FLAG{NETWORK_PACKET_HEX}`

---

### Node 10: The Master Enclave Riddle
* **Category:** Puzzle (4 of 4)
* **Difficulty:** Expert
* **Points:** 500 | **Hint Cost:** 250 PTS
* **Format:** `Single UPPERCASE word (8 letters)`
* **Accepted Answer:** `PASSWORD`
* **Provided Artifact:**
  ```text
  =====================================================
  MAINFRAME VAULT DOOR #10: FINAL CLEARANCE VERIFICATION
  =====================================================
  RIDDLE OF THE CORE:
  "I have no physical key, yet I unlock every terminal.
  I am strongest when I have symbols, numbers, and case.
  Administrators force you to change me every 90 days.
  Never share me with strangers or write me on a sticky note."

  QUESTION: What 8-letter credential word unlocks the final vault?
  =====================================================
  ```
* **Hint (Methodology Only):** Consider the fundamental secret string of characters required for user authentication, commonly paired with a username.
* **Solution Walkthrough:**
  The solution to the cybersecurity riddle is `PASSWORD`.
