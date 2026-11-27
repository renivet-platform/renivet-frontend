import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { signedClientIp } from "../src/lib/server/auth-client-ip";
const key = "test-only-proxy-key-that-is-at-least-32-characters";
const now = 1795780000000;
test("auth BFF only signs a single trusted ingress IP, never caller forwarding evidence", () => {
  const path = "/auth/sessions";
  const ip = "203.0.113.9";
  const request = new Request("https://app.example.test/api/auth/sessions", {headers: {"do-connecting-ip": ip, "x-forwarded-for":"192.0.2.9","x-renivet-client-ip-proof":"spoof"}});
  const ts = String(Math.floor(now/1000));
  const signature = createHmac("sha256", key).update(["v1",path,ts,ip].join("\n")).digest("hex");
  assert.equal(signedClientIp(request,path,key,true,now), ["v1",ts,ip,signature].join(";"));
  assert.equal(signedClientIp(request,path,key,false,now), undefined);
  assert.equal(signedClientIp(request,path,"short",true,now), undefined);
  assert.equal(signedClientIp(new Request(request.url,{headers:{"do-connecting-ip":"203.0.113.9, 192.0.2.1"}}),path,key,true,now), undefined);
});
