-- ==============================================================================
-- DATA HEIST: INITIAL SEED DATA
-- Pre-loads the 10 Challenges, Sample Teams, and 90-Minute Event Configuration
-- ==============================================================================

-- 1. Insert Event Configuration
INSERT INTO public.event_config (id, name, status, duration_minutes, start_time, end_time, venue_name, venue_room, map_quota, hints_allowed)
VALUES (
  'main',
  'DATA HEIST 2026',
  'active',
  90,
  NOW(),
  NOW() + INTERVAL '90 minutes',
  'Advanced Programming Lab',
  'Lab 304 - Cyber Enclave',
  6,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  duration_minutes = EXCLUDED.duration_minutes,
  venue_name = EXCLUDED.venue_name;

-- 2. Insert 10 Authoritative Challenges
INSERT INTO public.challenges (
  id, title, category, difficulty, points, description, clue, artifact_type, artifact_content, answer_format_hint, has_hint, hint_penalty_seconds, accepted_answers, answer_hash_sha256, hint_text
) VALUES
(
  1,
  'Breach The Gateway',
  'Cipher & Decoding',
  'Easy',
  100,
  'The mainframe gateway has rejected standard handshake protocols. A sensor tap captured an incoming raw base-encoded stream on port 8080. Decode the transmission to obtain the root bypass key.',
  'The payload was encoded using standard RFC 4648 Base64 serialization.',
  'cipher_stream',
  'QUNDRVNTX0dSQU5URURfUE9SVF84MDgw',
  'Format: UPPERCASE string with underscores (e.g., WORD_WORD_PORT_XXXX)',
  TRUE,
  60,
  ARRAY['access_granted_port_8080'],
  'b0c793ff0185a81e35a110dd5604130095ea81d9f09ebdbfba34125f187a54a0',
  'Use a Base64 decoder tool or terminal command: echo "QUNDRVNT..." | base64 -d'
),
(
  2,
  'The Caesar Infiltration',
  'Cipher & Decoding',
  'Easy',
  150,
  'An encrypted warning was found inside an abandoned terminal log. The rogue sysadmin left a 13-step rotation shift on the operational protocol string.',
  'Julius Caesar''s classic rotation (ROT13) shifts each letter halfway across the English alphabet.',
  'terminal_log',
  '[00:14:22] SYSLOG-DAEMON: SECURITY ANOMALY DETECTED
[00:14:23] INTERCEPTED_BUFFER: SVERJNYY_BIEEVQR_NPGVIR
[00:14:24] STATUS: ENCRYPTION APPLIED (ROT-13)',
  'Format: UPPERCASE string with underscores',
  TRUE,
  60,
  ARRAY['firewall_override_active'],
  '450702d080ec6ef32a4e21a48c66e4a28f8f902404b901dd1491cf1d2df0f653',
  'Shift each character back by 13 positions: S -> F, V -> I, etc.'
),
(
  3,
  'Kernel Memory Dump',
  'Reverse Engineering',
  'Medium',
  200,
  'The core memory bus crashed under heavy load, leaving behind a 64-byte hex segment. The hardware security module was holding a 10-character hexadecimal pointer.',
  'Inspect the hexadecimal values and translate the non-null ASCII bytes.',
  'hex',
  'OFFSET    00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F   ASCII
00000000  7F 45 4C 46 02 01 01 00  00 00 00 00 00 00 00 00   .ELF............
00000010  03 00 3E 00 01 00 00 00  90 58 02 00 00 00 00 00   ..>......X......
00000020  30 78 37 46 38 45 34 41  39 43 00 00 56 41 55 4C   0x7F8E4A9C..VAUL
00000030  54 5F 4B 45 59 00 00 00  DE AD BE EF 00 00 00 00   T_KEY...',
  'Format: 0x followed by 8 hex characters (e.g., 0xXXXXXXXX)',
  TRUE,
  90,
  ARRAY['0x7f8e4a9c'],
  '02e4e135be362da580a52df243689da442655a6d595166cf2c3325c3167191d8',
  'Look closely at offset 00000020. The ASCII column reveals the memory address directly.'
),
(
  4,
  'Steganography Signal',
  'Steganography',
  'Medium',
  250,
  'An HTTP response from the lab''s secure enclave carried an anomalous custom header containing a sequence of hex-paired ASCII nibbles.',
  'Each two-digit hexadecimal number corresponds to a standard ASCII character code.',
  'steganography',
  'HTTP/2 200 OK
Server: DataHeist-Enclave/4.2
Content-Type: application/octet-stream
X-Stego-Payload: 5155414e54554d5f454e54414e474c454d454e54
X-Parity-Check: 0x99A1
Cache-Control: no-store',
  'Format: TWO WORDS separated by underscore (UPPERCASE)',
  TRUE,
  90,
  ARRAY['quantum_entanglement'],
  '7b4aa787268d87a27fa463335db0dfd6dbde2ae5b839aaec9fefec024dc6c9ce',
  '51=''Q'', 55=''U'', 41=''A'', 4E=''N'', 54=''T'', 55=''U'', 4D=''M''... convert hex pairs to ASCII.'
),
(
  5,
  'Packet Sniffer (CTF)',
  'CTF Flag',
  'Medium',
  300,
  'A rogue team member spun up an unauthorized exfiltration tunnel. Wireshark intercepted this decoded packet snippet containing a high-value CTF flag.',
  'URL-decode the exfiltration query string parameter in the captured HTTP GET request.',
  'network_packet',
  'Frame 412: 184 bytes on wire (1472 bits)
Transmission Control Protocol, Src Port: 54122, Dst Port: 443
Hypertext Transfer Protocol:
    GET /vault/exfil?flag=HEIST%7Bp4ck3t_sn1ff3r_d3t3ct3d%7D&session=991 HTTP/1.1
    Host: exfil.dataheist.internal
    User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:109.0)',
  'Format: CTF Flag format HEIST{...}',
  TRUE,
  120,
  ARRAY['heist{p4ck3t_sn1ff3r_d3t3ct3d}'],
  '522137dd80f7aa0da2499d0baefd092c462704179377be83416b06385be66a01',
  '%7B is "{" and %7D is "}". Decode the query string flag value completely.'
),
(
  6,
  'SQL Injection Mystery',
  'Web & Database',
  'Medium',
  300,
  'The authentication subroutine evaluated an untrusted string. An attacker used a tautological payload to bypass authentication and dump the admin session token.',
  'Analyze the query execution log to find the generated bypass token.',
  'terminal_log',
  '[SQL-DEBUG] INCOMING QUERY: SELECT * FROM admin_creds WHERE user = '''' OR 1=1; --''
[SQL-ENGINE] Tautology validated. Row count: 1. Authentication forced TRUE.
[SQL-ENGINE] Auth token dispatched to client: ADMIN_BYPASS_TOKEN_404
[AUDIT-LOG] Warning: SQL Injection executed from terminal 192.168.10.42',
  'Format: ADMIN_BYPASS_TOKEN_XXX',
  TRUE,
  90,
  ARRAY['admin_bypass_token_404'],
  '0c9d64ba7135c7546452df39a38f323c28059ff9fb12b59ecad18bcf3baea1c4',
  'The token dispatched by the SQL-ENGINE after the injection succeeded is clearly logged in the audit trace.'
),
(
  7,
  'Polyalphabetic Enigma',
  'Cipher & Decoding',
  'Hard',
  350,
  'An encrypted directive was transmitted over the lab''s intercom system. The cryptogram was encoded with a Vigenère cipher using the event keyword "HEIST".',
  'Decrypt the ciphertext using the Vigenère square with the repeating key "HEIST".',
  'cipher_stream',
  'CIPHERTEXT : JPTLLV_UINPOVI_WGTJLVIQDLS
KEYWORD    : HEISTHEISTHEISTHEISTHEIST
ALGORITHM  : VIGENERE (A=0 ... Z=25)',
  'Format: THREE WORDS separated by underscores (UPPERCASE)',
  TRUE,
  120,
  ARRAY['cipher_machine_synchronized'],
  '7922d56d10fa095a4bb3133ff3ce2ae09bb2a1aeead9be67d7168db7f8e8ea6f',
  'Using key "HEIST": J - H = C, P - E = I, T - I = P... first word is CIPHER.'
),
(
  8,
  'Binary Hash Cracker',
  'Cryptographic Hash',
  'Hard',
  400,
  'During a vulnerability scan, a shadow password hash was scraped from /etc/shadow.bak. Break the unsalted MD5 hash to discover the root password.',
  'The password is 11 characters long, combines "cybercore" and the year "26".',
  'code',
  'SHADOW HASH SCRAPED:
Algorithm : MD5 (Message Digest 5)
Target Hash : 3a4f6be4e3f49ef40fbe3d221683be83
Entropy Assessment: Low complexity common collegiate password pattern.',
  'Format: lowercase alphanumeric string (11 characters)',
  TRUE,
  120,
  ARRAY['cybercore26'],
  '17bb4c3b6bf5772a0f8bfdfc1264c185bc0b0d3cb35824c96a84c6c99c3df313',
  'Verify the clue: Compute MD5("cybercore26") to see if it matches 3a4f6be4e3f49ef40fbe3d221683be83.'
),
(
  9,
  'Stack Overflow Shellcode (CTF)',
  'CTF Flag',
  'Expert',
  450,
  'A binary service running on port 31337 had an unprotected buffer. An attacker sent an exploit string to overwrite EIP and leak the secure enclave secret flag.',
  'Read the disassembled function return frame and reconstruct the flag payload.',
  'code',
  '0x000011a9 <+0>:   push   %rbp
0x000011aa <+1>:   mov    %rsp,%rbp
0x000011ad <+4>:   sub    $0x40,%rsp
0x000011b1 <+8>:   lea    -0x30(%rbp),%rax
0x000011b5 <+12>:  movabs $0x7b5453494548,%rbx   ; "HEIST{"
0x000011bf <+22>:  movabs $0x346b6334705f,%rcx   ; "_p4ck4" -> "st4ck_sm4sh"
0x000011c9 <+32>:  mov    $0x737333636375735f,%rdx ; "_success"
0x000011d3 <+42>:  callq  0x1030 <puts@plt>
FLAG RECONSTRUCTION: HEIST{st4ck_sm4sh1ng_succ3ss}',
  'Format: CTF Flag format HEIST{...}',
  TRUE,
  120,
  ARRAY['heist{st4ck_sm4sh1ng_succ3ss}'],
  '8682e88a385f099c0da9895c27dbd23f7ce93259dbb4c6e9195b8d0034a706b8',
  'The disassembled string literal in the exploit trace gives the flag directly.'
),
(
  10,
  'Master Vault Override',
  'Logic & Parity',
  'Expert',
  500,
  'The final barrier protecting the symposium data core! The master override protocol demands a synthesis of the security tokens verified across the previous nodes.',
  'Combine the overarching mission authorization code. Check the emergency protocols below.',
  'terminal_log',
  '[SYSTEM COMMAND CONSOLE - FINAL ENCLAVE NODE #10]
=====================================================
CRITICAL LOCKOUT STATUS: ARMED
REWARD STATUS: VENUE EXTRACTION MAP DISPATCH (TOP 6 ONLY)
=====================================================
PROTOCOL DIRECTIVE:
Enter the Emergency Alpha Override phrase to unlock the core.
The master cipher verification formula:
OMEGA + OVERRIDE + ROOT + VERIFIED
Joined by standard system delimiter "_".
=====================================================',
  'Format: UPPERCASE string with underscores (e.g., WORD_WORD_WORD_WORD)',
  TRUE,
  120,
  ARRAY['omega_override_root_verified'],
  '97da7dfca833b37803a64d1f237f3eb36a99ce4876a91c1ee0c791dd1eaeeef6',
  'Follow the protocol directive exactly: OMEGA_OVERRIDE_ROOT_VERIFIED'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  clue = EXCLUDED.clue,
  artifact_content = EXCLUDED.artifact_content,
  accepted_answers = EXCLUDED.accepted_answers,
  answer_hash_sha256 = EXCLUDED.answer_hash_sha256,
  hint_text = EXCLUDED.hint_text;

-- 3. Pre-seed Sample Symposium Participant Teams
INSERT INTO public.teams (id, name, username, current_challenge_index, is_completed, score, total_attempts)
VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Cyber Hawks', 'cyber_hawks', 1, FALSE, 0, 0),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Matrix Breakers', 'matrix_breakers', 1, FALSE, 0, 0),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Shadow Protocol', 'shadow_protocol', 1, FALSE, 0, 0),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Zero Day Squad', 'zero_day_squad', 1, FALSE, 0, 0),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Byte Force', 'byte_force', 1, FALSE, 0, 0),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Crypto Ninjas', 'crypto_ninjas', 1, FALSE, 0, 0),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'Glitch Hunters', 'glitch_hunters', 1, FALSE, 0, 0)
ON CONFLICT (name) DO NOTHING;
