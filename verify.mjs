// ════════════════════════════════════════════════════════════════════
// verify.mjs · minimal Node-only inclusion-proof verifier
//
// For casual auditing. The canonical verifier lives in
//   https://github.com/proofbydefault/nodatachat-core
// which uses the Web Crypto API and runs in browsers + Deno + Bun.
//
// Usage:
//   1. On nodatachat.com, open your receipt page
//      (/verify/ref/<your-ref>) and expand the "sibling chain" JSON.
//   2. Run:
//      node verify.mjs '{"leaf":"...","proof":[...],"expected_root":"..."}'
//
// Exit 0 + "verified: true" means the receipt is included in the epoch
// whose merkle_root you pasted. NoData cannot have altered the receipt
// without also forking GitHub history.
// ════════════════════════════════════════════════════════════════════

import { createHash } from 'node:crypto';

const raw = process.argv[2];
if (!raw) {
  console.error('Usage: node verify.mjs \'{"leaf":..., "proof":[...], "expected_root":...}\'');
  process.exit(2);
}

const { leaf, proof, expected_root } = JSON.parse(raw);

let cur = Buffer.from(leaf, 'hex');
for (const step of proof) {
  const sib = Buffer.from(step.sibling, 'hex');
  cur = createHash('sha256').update(
    step.sibling_is_right
      ? Buffer.concat([cur, sib])
      : Buffer.concat([sib, cur])
  ).digest();
}

const computed = cur.toString('hex');
const ok = computed === expected_root.toLowerCase();

console.log('leaf:          ', leaf);
console.log('proof_steps:   ', proof.length);
console.log('computed_root: ', computed);
console.log('expected_root: ', expected_root);
console.log('verified:      ', ok ? 'YES · receipt is included in this epoch' : 'NO · proof does not verify');
process.exit(ok ? 0 : 1);
