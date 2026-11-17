const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/Code.gs", "utf8");
const context = {
  console,
  Logger: { log() {} },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => "test" }) },
  SpreadsheetApp: {},
  LockService: {},
  ContentService: {},
  Charts: {},
  UrlFetchApp: {},
  Utilities: {
    formatDate(date, _tz, pattern) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(date);
      const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
      if (pattern === "yyyy-MM-dd") return `${p.year}-${p.month}-${p.day}`;
      if (pattern === "HH:mm") return `${p.hour}:${p.minute}`;
      throw new Error(`Unsupported test date pattern: ${pattern}`);
    }
  },
  Session: { getScriptTimeZone: () => "Asia/Kolkata" },
  Date,
  Error,
  JSON,
  String,
  Number,
  RegExp,
  Math
};
vm.createContext(context);
vm.runInContext(source, context, { filename: "Code.gs" });

const fixed = new Date("2026-11-16T10:00:00+05:30");
const parse = (s) => context.parse_(s, fixed);

test("formula feeding parses quantity and explicit time", () => {
  const r = parse("90 ml formula at 10:30 AM");
  assert.equal(r.ok, true);
  assert.equal(r.activity, "feeding");
  assert.equal(r.type, "formula");
  assert.equal(r.qty, 90);
  assert.equal(r.unit, "ml");
  assert.equal(r.time, "10:30");
});

test("expressed milk parses quantity", () => {
  const r = parse("60 ml expressed milk");
  assert.equal(r.ok, true);
  assert.equal(r.type, "expressed_milk");
  assert.equal(r.qty, 60);
  assert.equal(r.unit, "ml");
});

test("breastfeeding parses side and duration", () => {
  const r = parse("Breastfed left side for 15 minutes");
  assert.equal(r.ok, true);
  assert.equal(r.activity, "feeding");
  assert.equal(r.type, "breastfeeding");
  assert.equal(r.side, "left");
  assert.equal(r.mins, 15);
  assert.equal(r.qty, "");
});

test("wet diaper maps to urine", () => {
  assert.equal(parse("Wet diaper").activity, "urine");
});

test("stool message maps to stool", () => {
  assert.equal(parse("Baby passed stool").activity, "stool");
});

test("vitamin D maps to one supplement dose", () => {
  const r = parse("Vitamin D given");
  assert.equal(r.activity, "supplement");
  assert.equal(r.name, "Vitamin D");
  assert.equal(r.qty, 1);
  assert.equal(r.unit, "dose");
});

test("body bath maps to body bath", () => {
  const r = parse("Baby had body bath");
  assert.equal(r.activity, "bath");
  assert.equal(r.bath, "body");
});

test("HELP command is recognized", () => {
  assert.equal(parse("HELP").cmd, "HELP");
});

test("SUMMARY YESTERDAY command is recognized", () => {
  const r = parse("SUMMARY YESTERDAY");
  assert.equal(r.cmd, "SUMMARY");
  assert.equal(r.date, "2026-11-15");
});

test("formula without a volume requests clarification", () => {
  const r = parse("formula");
  assert.equal(r.ok, false);
  assert.match(r.reply, /quantity/i);
});

test("zero milk quantity is rejected", () => {
  const r = parse("0 ml formula");
  assert.equal(r.ok, false);
  assert.match(r.reply, /greater than zero/i);
});

test("direct feed phrase remains unsupported in checkpoint parser", () => {
  const r = parse("direct feed at 11AM");
  assert.equal(r.ok, false);
});

test("digits_ strips formatting from phone numbers", () => {
  assert.equal(context.digits_("+1 555-010-1234"), "15550101234");
});

test("eq_ accepts equal non-empty strings and rejects mismatch", () => {
  assert.equal(context.eq_("secret", "secret"), true);
  assert.equal(context.eq_("secret", "secreT"), false);
  assert.equal(context.eq_("", ""), false);
});
