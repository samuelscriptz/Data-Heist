import { ServerChallenge, ParticipantChallenge } from './types';

// The authoritative server-side challenge database
// Plaintext answers and hashes are NEVER shipped to the participant's client!
export const SERVER_CHALLENGES: ServerChallenge[] = [
  {
    id: 1,
    title: "Breach The Gateway",
    category: "Cipher & Decoding",
    difficulty: "Easy",
    points: 100,
    description: "The mainframe gateway has rejected standard handshake protocols. A sensor tap captured an incoming raw base-encoded stream on port 8080. Decode the transmission to obtain the root bypass key.",
    clue: "The payload was encoded using standard RFC 4648 Base64 serialization.",
    artifactType: "cipher_stream",
    artifactContent: "QUNDRVNTX0dSQU5URURfUE9SVF84MDgw",
    answerFormatHint: "Format: UPPERCASE string with underscores (e.g., WORD_WORD_PORT_XXXX)",
    hasHint: true,
    hintPenaltySeconds: 60,
    hintText: "Use a Base64 decoder tool or terminal command: echo 'QUNDRVNT...' | base64 -d",
    acceptedAnswers: ["access_granted_port_8080", "access_granted_port_8080"],
    answerHashSha256: "b0c793ff0185a81e35a110dd5604130095ea81d9f09ebdbfba34125f187a54a0",
    isUnlocked: true,
    isSolved: false,
  },
  {
    id: 2,
    title: "The Caesar Infiltration",
    category: "Cipher & Decoding",
    difficulty: "Easy",
    points: 150,
    description: "An encrypted warning was found inside an abandoned terminal log. The rogue sysadmin left a 13-step rotation shift on the operational protocol string.",
    clue: "Julius Caesar's classic rotation (ROT13) shifts each letter halfway across the English alphabet.",
    artifactType: "terminal_log",
    artifactContent: `[00:14:22] SYSLOG-DAEMON: SECURITY ANOMALY DETECTED
[00:14:23] INTERCEPTED_BUFFER: SVERJNYY_BIEEVQR_NPGVIR
[00:14:24] STATUS: ENCRYPTION APPLIED (ROT-13)`,
    answerFormatHint: "Format: UPPERCASE string with underscores",
    hasHint: true,
    hintPenaltySeconds: 60,
    hintText: "Shift each character back by 13 positions (or rotate again by 13): S -> F, V -> I, etc.",
    acceptedAnswers: ["firewall_override_active"],
    answerHashSha256: "450702d080ec6ef32a4e21a48c66e4a28f8f902404b901dd1491cf1d2df0f653",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 3,
    title: "Kernel Memory Dump",
    category: "Reverse Engineering",
    difficulty: "Medium",
    points: 200,
    description: "The core memory bus crashed under heavy load, leaving behind a 64-byte hex segment. The hardware security module was holding a 10-character hexadecimal pointer.",
    clue: "Inspect the hexadecimal values and translate the non-null ASCII bytes.",
    artifactType: "hex",
    artifactContent: `OFFSET    00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F   ASCII
00000000  7F 45 4C 46 02 01 01 00  00 00 00 00 00 00 00 00   .ELF............
00000010  03 00 3E 00 01 00 00 00  90 58 02 00 00 00 00 00   ..>......X......
00000020  30 78 37 46 38 45 34 41  39 43 00 00 56 41 55 4C   0x7F8E4A9C..VAUL
00000030  54 5F 4B 45 59 00 00 00  DE AD BE EF 00 00 00 00   T_KEY...`,
    answerFormatHint: "Format: 0x followed by 8 hex characters (e.g., 0xXXXXXXXX)",
    hasHint: true,
    hintPenaltySeconds: 90,
    hintText: "Look closely at offset 00000020. The ASCII column reveals the memory address directly.",
    acceptedAnswers: ["0x7f8e4a9c"],
    answerHashSha256: "02e4e135be362da580a52df243689da442655a6d595166cf2c3325c3167191d8",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 4,
    title: "Steganography Signal",
    category: "Steganography",
    difficulty: "Medium",
    points: 250,
    description: "An HTTP response from the lab's secure enclave carried an anomalous custom header containing a sequence of hex-paired ASCII nibbles.",
    clue: "Each two-digit hexadecimal number corresponds to a standard ASCII character code.",
    artifactType: "steganography",
    artifactContent: `HTTP/2 200 OK
Server: DataHeist-Enclave/4.2
Content-Type: application/octet-stream
X-Stego-Payload: 5155414e54554d5f454e54414e474c454d454e54
X-Parity-Check: 0x99A1
Cache-Control: no-store`,
    answerFormatHint: "Format: TWO WORDS separated by underscore (UPPERCASE)",
    hasHint: true,
    hintPenaltySeconds: 90,
    hintText: "51='Q', 55='U', 41='A', 4E='N', 54='T', 55='U', 4D='M'... convert the rest of the hex pairs to ASCII.",
    acceptedAnswers: ["quantum_entanglement"],
    answerHashSha256: "7b4aa787268d87a27fa463335db0dfd6dbde2ae5b839aaec9fefec024dc6c9ce",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 5,
    title: "Packet Sniffer (CTF)",
    category: "CTF Flag",
    difficulty: "Medium",
    points: 300,
    description: "A rogue team member spun up an unauthorized exfiltration tunnel. Wireshark intercepted this decoded packet snippet containing a high-value CTF flag.",
    clue: "URL-decode the exfiltration query string parameter in the captured HTTP GET request.",
    artifactType: "network_packet",
    artifactContent: `Frame 412: 184 bytes on wire (1472 bits)
Transmission Control Protocol, Src Port: 54122, Dst Port: 443
Hypertext Transfer Protocol:
    GET /vault/exfil?flag=HEIST%7Bp4ck3t_sn1ff3r_d3t3ct3d%7D&session=991 HTTP/1.1
    Host: exfil.dataheist.internal
    User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:109.0)
    Accept: text/html,application/xhtml+xml`,
    answerFormatHint: "Format: CTF Flag format HEIST{...}",
    hasHint: true,
    hintPenaltySeconds: 120,
    hintText: "%7B is '{' and %7D is '}'. Decode the query string flag value completely.",
    acceptedAnswers: ["heist{p4ck3t_sn1ff3r_d3t3ct3d}"],
    answerHashSha256: "522137dd80f7aa0da2499d0baefd092c462704179377be83416b06385be66a01",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 6,
    title: "SQL Injection Mystery",
    category: "Web & Database",
    difficulty: "Medium",
    points: 300,
    description: "The authentication subroutine evaluated an untrusted string. An attacker used a tautological payload to bypass authentication and dump the admin session token.",
    clue: "Analyze the query execution log to find the generated bypass token.",
    artifactType: "terminal_log",
    artifactContent: `[SQL-DEBUG] INCOMING QUERY: SELECT * FROM admin_creds WHERE user = '' OR 1=1; --'
[SQL-ENGINE] Tautology validated. Row count: 1. Authentication forced TRUE.
[SQL-ENGINE] Auth token dispatched to client: ADMIN_BYPASS_TOKEN_404
[AUDIT-LOG] Warning: SQL Injection executed from terminal 192.168.10.42`,
    answerFormatHint: "Format: ADMIN_BYPASS_TOKEN_XXX",
    hasHint: true,
    hintPenaltySeconds: 90,
    hintText: "The token dispatched by the SQL-ENGINE after the injection succeeded is clearly logged in the audit trace.",
    acceptedAnswers: ["admin_bypass_token_404"],
    answerHashSha256: "0c9d64ba7135c7546452df39a38f323c28059ff9fb12b59ecad18bcf3baea1c4",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 7,
    title: "Polyalphabetic Enigma",
    category: "Cipher & Decoding",
    difficulty: "Hard",
    points: 350,
    description: "An encrypted directive was transmitted over the lab's intercom system. The cryptogram was encoded with a Vigenère cipher using the event keyword 'HEIST'.",
    clue: "Decrypt the ciphertext using the Vigenère square with the repeating key 'HEIST'.",
    artifactType: "cipher_stream",
    artifactContent: `CIPHERTEXT : JPTLLV_UINPOVI_WGTJLVIQDLS
KEYWORD    : HEISTHEISTHEISTHEISTHEIST
ALGORITHM  : VIGENERE (A=0 ... Z=25)`,
    answerFormatHint: "Format: THREE WORDS separated by underscores (UPPERCASE)",
    hasHint: true,
    hintPenaltySeconds: 120,
    hintText: "Using key 'HEIST': J - H = C, P - E = I, T - I = P... first word is CIPHER.",
    acceptedAnswers: ["cipher_machine_synchronized"],
    answerHashSha256: "7922d56d10fa095a4bb3133ff3ce2ae09bb2a1aeead9be67d7168db7f8e8ea6f",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 8,
    title: "Binary Hash Cracker",
    category: "Cryptographic Hash",
    difficulty: "Hard",
    points: 400,
    description: "During a vulnerability scan, a shadow password hash was scraped from `/etc/shadow.bak`. Break the unsalted MD5 hash to discover the root password.",
    clue: "The password is 11 characters long, combines 'cybercore' and the year '26'.",
    artifactType: "code",
    artifactContent: `SHADOW HASH SCRAPED:
Algorithm : MD5 (Message Digest 5)
Target Hash : 3a4f6be4e3f49ef40fbe3d221683be83
Entropy Assessment: Low complexity common collegiate password pattern.`,
    answerFormatHint: "Format: lowercase alphanumeric string (11 characters)",
    hasHint: true,
    hintPenaltySeconds: 120,
    hintText: "Verify the clue: Compute MD5('cybercore26') to see if it matches 3a4f6be4e3f49ef40fbe3d221683be83.",
    acceptedAnswers: ["cybercore26"],
    answerHashSha256: "17bb4c3b6bf5772a0f8bfdfc1264c185bc0b0d3cb35824c96a84c6c99c3df313",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 9,
    title: "Stack Overflow Shellcode (CTF)",
    category: "CTF Flag",
    difficulty: "Expert",
    points: 450,
    description: "A binary service running on port 31337 had an unprotected buffer. An attacker sent an exploit string to overwrite EIP and leak the secure enclave secret flag.",
    clue: "Read the disassembled function return frame and reconstruct the flag payload.",
    artifactType: "code",
    artifactContent: `0x000011a9 <+0>:   push   %rbp
0x000011aa <+1>:   mov    %rsp,%rbp
0x000011ad <+4>:   sub    $0x40,%rsp
0x000011b1 <+8>:   lea    -0x30(%rbp),%rax
0x000011b5 <+12>:  movabs $0x7b5453494548,%rbx   ; "HEIST{"
0x000011bf <+22>:  movabs $0x346b6334705f,%rcx   ; "_p4ck4" -> "st4ck_sm4sh"
0x000011c9 <+32>:  mov    $0x737333636375735f,%rdx ; "_success"
0x000011d3 <+42>:  callq  0x1030 <puts@plt>
FLAG RECONSTRUCTION: HEIST{st4ck_sm4sh1ng_succ3ss}`,
    answerFormatHint: "Format: CTF Flag format HEIST{...}",
    hasHint: true,
    hintPenaltySeconds: 120,
    hintText: "The disassembled string literal and commentary in the exploit trace gives the flag directly.",
    acceptedAnswers: ["heist{st4ck_sm4sh1ng_succ3ss}"],
    answerHashSha256: "8682e88a385f099c0da9895c27dbd23f7ce93259dbb4c6e9195b8d0034a706b8",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 10,
    title: "Master Vault Override",
    category: "Logic & Parity",
    difficulty: "Expert",
    points: 500,
    description: "The final barrier protecting the symposium data core! The master override protocol demands a synthesis of the security tokens verified across the previous nodes.",
    clue: "Combine the overarching mission authorization code. Check the emergency protocols below.",
    artifactType: "terminal_log",
    artifactContent: `[SYSTEM COMMAND CONSOLE - FINAL ENCLAVE NODE #10]
=====================================================
CRITICAL LOCKOUT STATUS: ARMED
REWARD STATUS: VENUE EXTRACTION MAP DISPATCH (TOP 6 ONLY)
=====================================================
PROTOCOL DIRECTIVE:
Enter the Emergency Alpha Override phrase to unlock the core.
The master cipher verification formula:
OMEGA + OVERRIDE + ROOT + VERIFIED
Joined by standard system delimiter '_'.
=====================================================`,
    answerFormatHint: "Format: UPPERCASE string with underscores (e.g., WORD_WORD_WORD_WORD)",
    hasHint: true,
    hintPenaltySeconds: 120,
    hintText: "Follow the protocol directive exactly: OMEGA_OVERRIDE_ROOT_VERIFIED",
    acceptedAnswers: ["omega_override_root_verified"],
    answerHashSha256: "97da7dfca833b37803a64d1f237f3eb36a99ce4876a91c1ee0c791dd1eaeeef6",
    isUnlocked: false,
    isSolved: false,
  },
];

// Helper to get sanitized challenge for participant (no answers, no hint text if unbought)
export function getSanitizedChallenge(
  challengeId: number, 
  isUnlocked: boolean, 
  isSolved: boolean,
  hintRevealed: string | null = null
): ParticipantChallenge | null {
  const challenge = SERVER_CHALLENGES.find(c => c.id === challengeId);
  if (!challenge) return null;

  return {
    id: challenge.id,
    title: challenge.title,
    category: challenge.category,
    difficulty: challenge.difficulty,
    points: challenge.points,
    description: challenge.description,
    clue: challenge.clue,
    artifactType: challenge.artifactType,
    artifactContent: challenge.artifactContent,
    answerFormatHint: challenge.answerFormatHint,
    hasHint: challenge.hasHint,
    hintPenaltySeconds: challenge.hintPenaltySeconds,
    isUnlocked,
    isSolved,
    hintRevealed: hintRevealed ?? null,
  };
}
