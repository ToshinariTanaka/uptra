import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../billing.html",import.meta.url),"utf8");
test("billing page is inert and does not collect payment details",()=>{
assert.match(page,/開発用プレビュー／実課金なし/);
assert.match(page,/type="button" disabled/);
assert.doesNotMatch(page,/checkout\.stripe\.com|sk_live_|pk_live_/i);
assert.doesNotMatch(page,/type="(?:password|number|email)"/);
});
test("billing page uses member session rather than URL or localStorage",()=>{
assert.match(page,/getMemberSession\(\)/);
assert.match(page,/session\.account\?\.memberId/);
assert.doesNotMatch(page,/localStorage|URLSearchParams/);
});
