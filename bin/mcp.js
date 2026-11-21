/* MCP server over stdio for the rule-based namer. No dependencies.
 * Start it with:  actuarial-nomenclature mcp
 */
"use strict";
const api = require("../lib/api.js");
const readline = require("readline");

const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];
const TOOLS = [
  {
    name: "name_variable",
    description: "Turn a plain English description of a life insurance projection model variable into its standard name. Rule-based and deterministic: the same description always gives the same name. Returns status ok (use the name), needs_detail (the description is vague: ask the listed questions, then call again with the chosen revised_description), or failed. Never invent a name yourself.",
    inputSchema: { type: "object", properties: { description: { type: "string", description: "What the variable is, in plain English. Say whose share (reinsurance, net), the basis if one is stated, the kind of number (rate, count, present value) and when (start or end of period, valuation date)." } }, required: ["description"] },
  },
  {
    name: "read_name",
    description: "Read a standard variable name back into English and check it against the naming rules. Use it to understand a name in model code or to validate a name before using it.",
    inputSchema: { type: "object", properties: { name: { type: "string", description: "A variable name such as CLM_DTH_RI_BE_PV_EOP." } }, required: ["name"] },
  },
  {
    name: "check_list",
    description: "Name or check many variables at once. Flags vague descriptions, given names that break the rules or do not match their description, and different descriptions that end up with the same name.",
    inputSchema: { type: "object", properties: { items: { type: "array", description: "One entry per variable.", items: { type: "object", properties: { description: { type: "string" }, name: { type: "string", description: "Optional. A name already in use, to be checked against the description." } }, required: ["description"] } } }, required: ["items"] },
  },
  {
    name: "search_glossary",
    description: "Look up terms in the controlled glossary by short form, full term, everyday word or definition. Returns the definition, what the term is not to be confused with, and related terms.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer", description: "Most terms to return. Default 10." } }, required: ["query"] },
  },
  {
    name: "naming_rules",
    description: "A short summary of the naming grammar: the slot order, the defaults and the points on which a description must be explicit.",
    inputSchema: { type: "object", properties: {} },
  },
];

function call(name, args) {
  args = args || {};
  if (name === "name_variable") { return api.nameVariable(args.description); }
  if (name === "read_name") { return api.readName(args.name); }
  if (name === "check_list") { return api.checkList(args.items); }
  if (name === "search_glossary") { return api.searchGlossary(args.query, args.limit); }
  if (name === "naming_rules") { return { rules: api.RULES }; }
  throw new Error("Unknown tool: " + name);
}

function send(msg) { process.stdout.write(JSON.stringify(msg) + "\n"); }

function handle(msg) {
  const id = msg.id;
  const isRequest = id !== undefined && id !== null;
  try {
    if (msg.method === "initialize") {
      const want = msg.params && msg.params.protocolVersion;
      return send({ jsonrpc: "2.0", id, result: {
        protocolVersion: SUPPORTED.indexOf(want) >= 0 ? want : SUPPORTED[0],
        capabilities: { tools: {} },
        serverInfo: { name: "actuarial-nomenclature", version: api.version },
        instructions: "Use name_variable to get the standard name for any life insurance projection model variable. Do not make up names or tokens. If the answer is needs_detail, ask the user the questions it lists.",
      } });
    }
    if (msg.method === "ping") { return send({ jsonrpc: "2.0", id, result: {} }); }
    if (msg.method === "tools/list") { return send({ jsonrpc: "2.0", id, result: { tools: TOOLS } }); }
    if (msg.method === "tools/call") {
      let result, isError = false;
      try { result = call(msg.params.name, msg.params.arguments); }
      catch (e) { result = { error: e.message }; isError = true; }
      return send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result, isError } });
    }
    if (!isRequest) { return; } // notifications need no reply
    send({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found: " + msg.method } });
  } catch (e) {
    if (isRequest) { send({ jsonrpc: "2.0", id, error: { code: -32603, message: e.message } }); }
  }
}

function start() {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  rl.on("line", (line) => {
    line = line.trim();
    if (!line) { return; }
    let msg;
    try { msg = JSON.parse(line); } catch (e) { return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }); }
    (Array.isArray(msg) ? msg : [msg]).forEach(handle);
  });
  rl.on("close", () => process.exit(0));
}

module.exports = { start, TOOLS };
