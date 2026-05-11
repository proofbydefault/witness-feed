# NoData · Public Witness Feed

Append-only Merkle commitments over operator receipts issued by [nodatachat.com](https://nodatachat.com). Published hourly. Each file covers one UTC hour.

**Commitment-only · zero business detail.**

---

## What's published

Every UTC hour, all receipts in that window are sealed into a Merkle tree, the root is signed with Ed25519, and a JSON file is written here:

```
epochs/YYYY-MM/YYYY-MM-DD-HH.json
```

Schema per file:

| Field | Type | Notes |
|---|---|---|
| `epoch_number` | int | monotonic, starts at 1 |
| `sealed_at` | ISO8601 | UTC timestamp of seal creation |
| `epoch_start_at` / `epoch_end_at` | ISO8601 | UTC-hour window boundaries |
| `receipt_count` | int | how many receipts rolled in |
| `merkle_root` | hex(64) | SHA-256 over sorted leaves |
| `signed_root_hex` | hex | Ed25519 signature over the root |
| `signing_pubkey_hex` | hex | Ed25519 public key |
| `prev_epoch_number` / `prev_epoch_root` | int / hex | chain link to previous epoch |
| `ots_proof_b64` | base64 | optional Bitcoin OpenTimestamps anchor |

## What's NOT here

No receipt ids. No proof refs. No tenant ids. No payloads. No event types. No names.

Only cryptographic commitments.

---

## Verifying a receipt

Use the open-source verifier from [`@nodatachat/core`](https://github.com/proofbydefault/nodatachat-core) · pure SHA-256 math, Web Crypto API, zero dependencies.

```typescript
import { verifyInclusion } from '@nodatachat/core';

// 1. Inclusion proof copied from your receipt page on nodatachat.com
//    (https://nodatachat.com/verify/ref/<your-ref> → expand sibling chain)
const { leaf, proof } = JSON.parse(/* your copied JSON */);

// 2. merkle_root from the epoch file in THIS repo
const epoch = await fetch(
  'https://raw.githubusercontent.com/proofbydefault/witness-feed/main/' +
  'epochs/2026-05/2026-05-11-18.json'
).then(r => r.json());

// 3. Verify locally · pure math, no network beyond the fetch above
const ok = await verifyInclusion(leaf, proof, epoch.merkle_root);
// → true if the receipt was included in that epoch
```

A minimal Node-only verifier without `@nodatachat/core` is in [`verify.mjs`](./verify.mjs) for casual auditing:

```bash
node verify.mjs '{"leaf":"...","proof":[...],"expected_root":"..."}'
```

---

## Why this exists

Trust shouldn't depend on NoData remaining honest, online, or alive.

This repo is third-party storage (GitHub) of cryptographic commitments. The verifier in [`@nodatachat/core`](https://github.com/proofbydefault/nodatachat-core) is open source. Even if NoData disappears tomorrow, anyone with a receipt + this feed + the verifier can still prove what existed at sealing time.

The split:

| | **Public** | **Private** |
|---|---|---|
| Code | `proofbydefault/nodatachat-core` (verifier · MIT) | NoData platform (private) |
| Data | `proofbydefault/witness-feed` (commitments · CC0) | NoData platform (full receipts) |

The intersection of public code + public commitments + your private receipt = cryptographic proof that does not depend on us.

---

## License

The data files in this repo are **CC0** · public-domain commitments. The verifier code lives in [`nodatachat-core`](https://github.com/proofbydefault/nodatachat-core) under MIT.
