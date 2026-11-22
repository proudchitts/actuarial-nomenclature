#!/usr/bin/env node
/* Tests the command line, the HTTP API and the MCP server. Run:  node tools/test_api.js */
const { spawn, execFileSync } = require("child_process");
const path = require("path");
const http = require("http");
const cli = path.join(path.dirname(__dirname), "bin", "cli.js");
let fail = 0;
const ok = (cond, label) => { if (!cond) { fail++; console.log("FAIL:", label); } else { console.log("ok  :", label); } };

// command line
const out = JSON.parse(execFileSync("node", [cli, "name", "Death claims in the period"], { encoding: "utf8" }));
ok(out.status === "ok" && out.name === "CLM_DTH", "cli name");
let code = 0, vague;
try { execFileSync("node", [cli, "name", "Lapse rate"], { encoding: "utf8" }); } catch (e) { code = e.status; vague = JSON.parse(e.stdout); }
ok(code === 2 && vague.status === "needs_detail" && vague.name === null && vague.questions[0].options[0].revised_description, "cli refuses a vague description");

function mcp() {
  return new Promise((resolve) => {
    const p = spawn("node", [cli, "mcp"]);
    let buf = "";
    const got = {};
    p.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); got[m.id] = m; if (m.id === 6) { p.stdin.end(); } }
    });
    p.on("close", () => resolve(got));
    const w = (m) => p.stdin.write(JSON.stringify(m) + "\n");
    w({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } } });
    w({ jsonrpc: "2.0", method: "notifications/initialized" });
    w({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    w({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "name_variable", arguments: { description: "Present value at the end of the period of future death claims recovered from reinsurers, best estimate" } } });
    w({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "name_variable", arguments: { description: "Withdrawals in the period" } } });
    w({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "check_list", arguments: { items: [{ description: "Death claims in the period" }, { description: "Claims on death in the period" }, { name: "BEL_EOP", description: "Best estimate liability at the start of the period" }] } } });
    w({ jsonrpc: "2.0", id: 6, method: "nope" });
  });
}

function httpTest() {
  return new Promise((resolve) => {
    const p = spawn("node", [cli, "serve", "--port", "8799"]);
    p.stderr.once("data", () => {
      const req = http.request({ host: "127.0.0.1", port: 8799, path: "/name", method: "POST", headers: { "Content-Type": "application/json" } }, (res) => {
        let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => {
          http.get("http://127.0.0.1:8799/read?name=LPS_DEP_RATE_MTH", (r2) => { let c = ""; r2.on("data", (x) => (c += x)); r2.on("end", () => { p.kill(); resolve([JSON.parse(b), JSON.parse(c)]); }); });
        });
      });
      req.end(JSON.stringify({ description: "Number of policies in force at the end of the period" }));
    });
  });
}

(async () => {
  const g = await mcp();
  ok(g[1] && g[1].result.protocolVersion === "2025-06-18" && g[1].result.capabilities.tools, "mcp initialize");
  ok(g[2] && g[2].result.tools.length === 6, "mcp lists 6 tools");
  ok(g[3] && g[3].result.structuredContent.name === "CLM_DTH_RI_BE_PV_EOP" && !g[3].result.isError, "mcp name_variable");
  ok(g[4] && g[4].result.structuredContent.status === "needs_detail" && g[4].result.structuredContent.name === null, "mcp refuses a vague description");
  const c = g[5] && g[5].result.structuredContent;
  ok(c && c.lines_sharing_a_name === 2 && c.results[2].status === "fix", "mcp check_list flags a shared name and a mismatch");
  ok(g[6] && g[6].error && g[6].error.code === -32601, "mcp unknown method");
  const [h1, h2] = await httpTest();
  ok(h1.name === "POL_IF_CNT_EOP", "http POST /name");
  ok(h2.valid && /lapse/.test(h2.reads_as), "http GET /read");
  // suggestions by wording must work with no embedding library
  const api = require(path.join(path.dirname(__dirname), "lib", "api.js"));
  const s = await api.suggestTerms("Commision paid in the period", { semantic: false });
  ok(s.suggestions.length === 1 && s.suggestions[0].closest_terms[0].short_form === "COMM", "suggest finds commission from a misspelling");
  const nv = api.nameVariable(s.suggestions[0].closest_terms[0].revised_description);
  ok(nv.status === "ok" && nv.name === "COMM", "the revised description then names cleanly");
  const SG = require(path.join(path.dirname(__dirname), "docs", "suggest.js")).create(require(path.join(path.dirname(__dirname), "docs", "data.js")));
  ok(require(path.join(path.dirname(__dirname), "docs", "embeddings.js")).key === SG.key, "docs/embeddings.js is up to date with the glossary");
  if (fail) { console.log("\nFAILED: " + fail); process.exit(1); }
  console.log("\nAll interface tests passed.");
})();
