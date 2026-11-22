#!/usr/bin/env node
/* Command line, HTTP API and MCP entry point. No dependencies.
 *
 *   actuarial-nomenclature name "Death claims in the period"
 *   actuarial-nomenclature suggest "Money paid to the broker in the period"
 *   actuarial-nomenclature read CLM_DTH_RI_BE_PV_EOP
 *   actuarial-nomenclature check variables.txt
 *   actuarial-nomenclature find "dread disease"
 *   actuarial-nomenclature serve --port 8787
 *   actuarial-nomenclature mcp
 */
"use strict";
const fs = require("fs");
const http = require("http");
const api = require("../lib/api.js");

const args = process.argv.slice(2);
const cmd = args[0];
const print = (x) => console.log(JSON.stringify(x, null, 2));

function serve(port, host) {
  const send = (res, code, body) => {
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" });
    res.end(JSON.stringify(body, null, 2));
  };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "OPTIONS") { return send(res, 204, {}); }
    if (req.method === "GET") {
      const q = url.searchParams;
      if (url.pathname === "/") { return send(res, 200, { service: "actuarial-nomenclature", version: api.version, terms: api.termCount, routes: ["GET or POST /name (description)", "GET or POST /read (name)", "POST /check (items)", "GET or POST /suggest (description)", "GET /glossary?q=", "GET /rules"] }); }
      if (url.pathname === "/name") { return send(res, 200, api.nameVariable(q.get("description"))); }
      if (url.pathname === "/read") { return send(res, 200, api.readName(q.get("name"))); }
      if (url.pathname === "/suggest") { return api.suggestTerms(q.get("description")).then((r) => send(res, 200, r)); }
      if (url.pathname === "/glossary") { return send(res, 200, api.searchGlossary(q.get("q"), Number(q.get("limit")) || 10)); }
      if (url.pathname === "/rules") { return send(res, 200, { rules: api.RULES }); }
      return send(res, 404, { error: "Not found" });
    }
    if (req.method !== "POST") { return send(res, 405, { error: "Use GET or POST" }); }
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 2e6) { req.destroy(); } });
    req.on("end", () => {
      let j;
      try { j = body ? JSON.parse(body) : {}; } catch (e) { return send(res, 400, { error: "The body must be JSON" }); }
      if (url.pathname === "/name") { return send(res, 200, api.nameVariable(j.description)); }
      if (url.pathname === "/read") { return send(res, 200, api.readName(j.name)); }
      if (url.pathname === "/check") { return send(res, 200, api.checkList(j.items)); }
      if (url.pathname === "/suggest") { return api.suggestTerms(j.description).then((r) => send(res, 200, r)); }
      send(res, 404, { error: "Not found" });
    });
  });
  server.listen(port, host, () => console.error("actuarial-nomenclature API on http://" + host + ":" + port));
}

function flag(name, dflt) { const i = args.indexOf("--" + name); return i >= 0 && args[i + 1] ? args[i + 1] : dflt; }

if (cmd === "mcp") {
  require("./mcp.js").start();
} else if (cmd === "name" && args[1]) {
  const r = api.nameVariable(args.slice(1).join(" "));
  print(r);
  process.exitCode = r.status === "ok" ? 0 : 2;
} else if (cmd === "read" && args[1]) {
  const r = api.readName(args[1]);
  print(r);
  process.exitCode = r.valid ? 0 : 2;
} else if (cmd === "check" && args[1]) {
  const lines = fs.readFileSync(args[1] === "-" ? 0 : args[1], "utf8").split(/\r?\n/).filter((l) => l.trim());
  const r = api.checkList(lines);
  print(r);
  process.exitCode = r.fix ? 2 : 0;
} else if (cmd === "suggest" && args[1]) {
  api.suggestTerms(args.slice(1).filter((a) => a !== "--no-meaning").join(" "), { semantic: args.indexOf("--no-meaning") < 0 }).then(print);
} else if (cmd === "find" && args[1]) {
  print(api.searchGlossary(args.slice(1).join(" "), 10));
} else if (cmd === "rules") {
  console.log(api.RULES);
} else if (cmd === "serve") {
  serve(Number(flag("port", 8787)), flag("host", "127.0.0.1"));
} else {
  console.log([
    "actuarial-nomenclature " + api.version + " (" + api.termCount + " terms). Rule-based, no AI, no network calls.",
    "",
    "  name \"<description>\"   description to name, as JSON",
    "  suggest \"<description>\" closest glossary terms for the words that were not used",
    "  read <NAME>            name to English, with a rule check",
    "  check <file|->         one variable per line: a description, or NAME | description",
    "  find \"<word>\"          search the glossary",
    "  rules                  the naming grammar in short",
    "  serve [--port 8787] [--host 127.0.0.1]   HTTP API",
    "  mcp                    MCP server over stdio, for AI tools",
  ].join("\n"));
}
