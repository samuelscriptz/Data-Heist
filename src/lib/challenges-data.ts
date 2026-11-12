import { ServerChallenge, ParticipantChallenge } from './types';

// The authoritative server-side challenge database
// Composition: 4 Decrypting questions, 4 Puzzle questions, 2 CTF questions
// All answers are evaluated in UPPERCASE. Plaintext answers and hashes are never shipped to the client!
export const SERVER_CHALLENGES: ServerChallenge[] = [
  {
    id: 1,
    title: "Gateway Cipher Stream",
    category: "Decrypting",
    difficulty: "Easy",
    points: 100,
    hintCost: 50,
    description: "An incoming handshake packet was captured on perimeter port 8080. The transmission payload is encoded using standard RFC 4648 Base64 serialization. Decode the transmission stream to obtain the root gateway override token.",
    clue: "Raw payload intercepted: SEVJU1RfVEVSTUlOQUxfT1ZFUlJJREU=",
    artifactType: "cipher_stream",
    artifactContent: "SEVJU1RfVEVSTUlOQUxfT1ZFUlJJREU=",
    answerFormatHint: "Format: UPPERCASE string with underscores",
    hasHint: true,
    hintPenaltySeconds: 60,
    hintText: "The payload is serialized using standard RFC 4648 Base64 encoding. Use a Base64 decoding algorithm, terminal utility (base64 -d), or online cryptanalytic tool.",
    acceptedAnswers: ["HEIST_TERMINAL_OVERRIDE"],
    answerHashSha256: "efc812ebedb1c94791aff07ef58cefba21eda4775d061aa10e66ecd7442b2ffb",
    isUnlocked: true,
    isSolved: false,
  },
  {
    id: 2,
    title: "The Tri-Word Association",
    category: "Puzzle",
    difficulty: "Easy",
    points: 150,
    hintCost: 75,
    description: "The authentication subroutine presents a word association puzzle. Find the single 6-letter computer science term that meaningfully completes all three fundamental computing concepts below.",
    clue: "Identify the computing term that connects logarithmic search, tree hierarchies, and foundational machine digits.",
    artifactType: "terminal_log",
    artifactContent: `[SECURITY VERIFICATION PUZZLE: 6-LETTER COMPUTING TERM]
1. [ ______ ] Search  -> The efficient divide-and-conquer logarithmic lookup algorithm.
2. [ ______ ] Tree    -> A fundamental hierarchical data structure with at most 2 child nodes.
3. [ ______ ] Digits  -> The fundamental base-2 0s and 1s processed by computer processors.`,
    answerFormatHint: "Format: Single UPPERCASE word (6 letters)",
    hasHint: true,
    hintPenaltySeconds: 60,
    hintText: "Think of the mathematical number system with radix 2 that serves as the root foundation of all digital electronics and computing architectures.",
    acceptedAnswers: ["BINARY"],
    answerHashSha256: "4c77b56b7cf3077c725c2f433eb76156bd231c23b56805f5a06fc06b87450a43",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 3,
    title: "The Caesar Shift Alert",
    category: "Decrypting",
    difficulty: "Medium",
    points: 200,
    hintCost: 100,
    description: "An encrypted warning was flagged in the firewall daemon logs. A rogue operator rotated the incident alert string by 13 alphabetical positions (ROT13) to evade intrusion keyword filters. Revert the shift to retrieve the alert phrase.",
    clue: "Firewall log buffer: SVERJNYY_OERNPU_QRGRPGRQ",
    artifactType: "terminal_log",
    artifactContent: `[02:14:09] INTRUSION-DAEMON: SECURITY ANOMALY DETECTED
[02:14:10] ENCRYPTION-TYPE: ROT13 SUBSTITUTION
[02:14:11] INTERCEPTED_BUFFER: SVERJNYY_OERNPU_QRGRPGRQ
[02:14:12] ACTION: REVERT ROT13 SHIFT TO RETRIEVE ALERT`,
    answerFormatHint: "Format: UPPERCASE string with underscores",
    hasHint: true,
    hintPenaltySeconds: 60,
    hintText: "The ciphertext uses a ROT-13 symmetric rotation (each letter shifted by 13 positions in the 26-letter Latin alphabet). Applying the 13-letter shift once more restores the plaintext.",
    acceptedAnswers: ["FIREWALL_BREACH_DETECTED"],
    answerHashSha256: "8cdd18c0372b9b56b75d4b302b9d6fbab7b863f37d284fd41f0fb2e773f6315f",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 4,
    title: "The Three Server Rooms",
    category: "Puzzle",
    difficulty: "Medium",
    points: 250,
    hintCost: 125,
    description: "Three critical servers named Server Alpha, Server Beta, and Server Gamma are housed individually across three rooms: Room 101, Room 102, and Room 103. Each server features a single LED indicator light glowing RED, BLUE, or GREEN.\n\nUse the audit facts in the terminal artifact to deduce which server is located inside Room 101.",
    clue: "Analyze the 3 audit facts systematically using process of elimination.",
    artifactType: "terminal_log",
    artifactContent: `[INFRASTRUCTURE AUDIT REPORT]
FACILITY ROOMS: Room 101 | Room 102 | Room 103
SERVERS       : Server Alpha | Server Beta | Server Gamma
STATUS LIGHTS : Green | Blue | Red

DISCLOSED AUDIT FACTS:
1. Server Alpha is NOT in Room 101, and its status light glows GREEN.
2. The server located in Room 102 has a BLUE status light.
3. Server Gamma is physically located in Room 103.

QUESTION:
Which server is located in Room 101?`,
    answerFormatHint: "Format: UPPERCASE server name (e.g., ALPHA, BETA, or GAMMA)",
    hasHint: true,
    hintPenaltySeconds: 60,
    hintText: "Use deductive reasoning: Fact 3 fixes Gamma in Room 103. Therefore only Alpha and Beta remain for Rooms 101 and 102. Check Fact 1 regarding where Alpha cannot be situated.",
    acceptedAnswers: ["SERVER_BETA", "BETA", "SERVER BETA"],
    answerHashSha256: "460f1dc94eea05d72952df34302c7eae443e00311b5b1f412d40df8d06630d0c",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 5,
    title: "HTTP Header Token Infiltration",
    category: "CTF Flag",
    difficulty: "Medium",
    points: 300,
    hintCost: 150,
    description: "A target administrative API endpoint was captured during network reconnaissance. The development team concealed an authorization token inside a custom HTTP response header, serialized in RFC 4648 Base64. Inspect the HTTP raw header dump, locate the staging token header, and decode its payload to capture the flag.",
    clue: "Inspect the raw HTTP response headers for non-standard staging directives.",
    artifactType: "code",
    artifactContent: `HTTP/1.1 200 OK
Date: Sun, 09 Nov 2026 08:30:00 GMT
Server: Apache/2.4.52 (Ubuntu)
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-Staging-Token: RkxBR3tXRUJfSEVBREVSX0VYVFJBQ1RFRH0=
Content-Type: text/html; charset=UTF-8
Content-Length: 312

<!DOCTYPE html>
<html>
  <head><title>Staging Mainframe Gateway</title></head>
  <body>
    <h2>Restricted Administrative Subsystem</h2>
    <p>Authentication token required in staging headers.</p>
  </body>
</html>`,
    answerFormatHint: "Format: CTF Flag format FLAG{...} in UPPERCASE",
    hasHint: true,
    hintPenaltySeconds: 90,
    hintText: "Locate the custom HTTP header beginning with 'X-'. The token value is encoded in RFC 4648 Base64. Extract the token and decode it using a standard Base64 decoder.",
    acceptedAnswers: ["FLAG{WEB_HEADER_EXTRACTED}"],
    answerHashSha256: "ca5d9c0741d272209653be21f2ad5194a4c11cf4e880de746f5e8f096ff83d88",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 6,
    title: "Raw Hex Byte Stream",
    category: "Decrypting",
    difficulty: "Medium",
    points: 300,
    hintCost: 150,
    description: "A network tap captured a raw hexadecimal byte sequence traveling to the mainframe security module. Convert the two-digit hex pairs into readable ASCII characters to obtain the enclave passphrase.",
    clue: "Captured raw hex stream: 53 45 43 55 52 45 5F 4D 41 49 4E 46 52 41 4D 45",
    artifactType: "hex",
    artifactContent: `CAPTURED RAW HEX DUMP:
53 45 43 55 52 45 5F 4D 41 49 4E 46 52 41 4D 45

SYSTEM NOTICE:
Byte sequence is encoded in standard 8-bit ASCII hexadecimal representation.`,
    answerFormatHint: "Format: TWO UPPERCASE words separated by underscore",
    hasHint: true,
    hintPenaltySeconds: 60,
    hintText: "Each two-digit hex pair represents one ASCII character in hexadecimal (base 16). For example, 0x41 is 'A', 0x5F is '_'. Convert each hex byte into its ASCII character equivalent.",
    acceptedAnswers: ["SECURE_MAINFRAME"],
    answerHashSha256: "b90a1c35fcbc8aa10d38a0d382dc4540548592c5216b1f7d9ae87ce457d004f7",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 7,
    title: "The Scrambled Diagnostic Tool",
    category: "Puzzle",
    difficulty: "Hard",
    points: 350,
    hintCost: 175,
    description: "A terminal crash log dumped an unscrambled 10-letter anagram of a famous diagnostic command. Systems engineers rely on this network utility to trace the exact route and measure transit delays of packets across an Internet Protocol (IP) network.",
    clue: "Scrambled letters: E - R - T - O - A - U - C - E - R - T",
    artifactType: "terminal_log",
    artifactContent: `[DIAGNOSTIC CRASH REPORT - IDENTIFIER BUFFER CORRUPTED]
ANAGRAM SCRAMBLED LETTERS:
E - R - T - O - A - U - C - E - R - T

SYSTEM PARAMETERS:
- Word Length  : Exactly 10 Letters
- Category     : Network Diagnostic Utility
- Action       : Traces hops and latency to remote hosts`,
    answerFormatHint: "Format: Single UPPERCASE command name (10 letters)",
    hasHint: true,
    hintPenaltySeconds: 90,
    hintText: "Unscramble the letters to form the standard Unix/Linux networking tool that sends packets with incrementing TTL (Time-To-Live) values to map the path to a server.",
    acceptedAnswers: ["TRACEROUTE"],
    answerHashSha256: "5e7ede6cbb3f0f55e3830ca53e4912dd0d628673d0f5776ac0a08d575e7a62d2",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 8,
    title: "The Polyalphabetic Directive",
    category: "Decrypting",
    difficulty: "Hard",
    points: 400,
    hintCost: 200,
    description: "An encrypted operational directive was broadcast across the lab's radio frequency. It was encrypted using the classic Vigenère polyalphabetic cipher with the symposium keyword 'HEIST'. Decrypt the ciphertext to retrieve the mission clearance phrase.",
    clue: "Ciphertext: KEBS_ALMAL_OPGBGKF | Key: HEIST",
    artifactType: "cipher_stream",
    artifactContent: `CIPHERTEXT : KEBS_ALMAL_OPGBGKF
KEYWORD    : HEIST
ALGORITHM  : VIGENERE (A=0, B=1, ... Z=25)

MATHEMATICAL FORMULA:
Pi = (Ci - Ki + 26) mod 26
(Underscores are preserved)`,
    answerFormatHint: "Format: THREE UPPERCASE words separated by underscores",
    hasHint: true,
    hintPenaltySeconds: 90,
    hintText: "This polyalphabetic substitution shifts each letter backwards according to the corresponding letter of the repeated key 'HEISTHEIST...'. Align each ciphertext character with the repeated key and reverse the Caesar shift.",
    acceptedAnswers: ["DATA_HEIST_VICTORY"],
    answerHashSha256: "82efa3f6577989024a5a3371e3675a74b4ec4f1efe7394da6008d2bbdaf0ab22",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 9,
    title: "Network Packet Telemetry Stream",
    category: "CTF Flag",
    difficulty: "Expert",
    points: 450,
    hintCost: 225,
    description: "A deep-packet inspection alert was triggered on an anomalous outbound HTTP beacon. An attacker concealed an exfiltrated flag inside the query parameter as a continuous hexadecimal string. Reconstruct the hex byte sequence from the URL query and decode it to obtain the flag.",
    clue: "Inspect the telemetry beacon query string parameter for encoded hex bytes.",
    artifactType: "network_packet",
    artifactContent: `WIRESHARK PACKET DISSECTION [Frame #8104]
----------------------------------------------------------------------
Frame Length: 214 bytes on wire
Transmission Control Protocol: Src Port: 54102, Dst Port: 80
Hypertext Transfer Protocol:
  GET /telemetry/beacon?stream=464C41477B4E4554574F524B5F5041434B45545F4845587D HTTP/1.1
  Host: c2-collector.internal.heist
  User-Agent: DataHeist-Agent/4.1
  Accept: */*
  Connection: close
----------------------------------------------------------------------`,
    answerFormatHint: "Format: CTF Flag format FLAG{...} in UPPERCASE",
    hasHint: true,
    hintPenaltySeconds: 90,
    hintText: "The 'stream' parameter in the GET request contains ASCII characters represented as two-digit hexadecimal values. Group the hex string into pairs of two (e.g. 46 4C 41...) and translate each byte into its ASCII character.",
    acceptedAnswers: ["FLAG{NETWORK_PACKET_HEX}"],
    answerHashSha256: "a0a86a3b69044dbb8281fa055cc3ddb574f50453a5c22c820f32b18a22c443dd",
    isUnlocked: false,
    isSolved: false,
  },
  {
    id: 10,
    title: "The Master Enclave Riddle",
    category: "Puzzle",
    difficulty: "Expert",
    points: 500,
    hintCost: 250,
    description: "You have arrived at the final security gate guarding the building's physical venue map! The enclave door lock is protected by an electronic keypad demanding an 8-letter credential word. An inscription etched onto the terminal presents the following cybersecurity riddle:",
    clue: "An 8-letter credential word central to computer authentication and security hygiene.",
    artifactType: "terminal_log",
    artifactContent: `=====================================================
MAINFRAME VAULT DOOR #10: FINAL CLEARANCE VERIFICATION
=====================================================
RIDDLE OF THE CORE:
"I have no physical key, yet I unlock every terminal.
I am strongest when I have symbols, numbers, and case.
Administrators force you to change me every 90 days.
Never share me with strangers or write me on a sticky note."

QUESTION: What 8-letter credential word unlocks the final vault?
=====================================================`,
    answerFormatHint: "Format: Single UPPERCASE word (8 letters)",
    hasHint: true,
    hintPenaltySeconds: 90,
    hintText: "Consider the fundamental secret string of characters required for user authentication, commonly paired with a username.",
    acceptedAnswers: ["PASSWORD"],
    answerHashSha256: "0be64ae89ddd24e225434de95d501711339baeee18f009ba9b4369af27d30d60",
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
    hintCost: challenge.hintCost,
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
