#!/usr/bin/env node
// Dev-only check: diffs the BUILT Polar node (dist/) against Polar's versioned OpenAPI spec.
// Usage: npm run build && node scripts/audit-openapi.mjs [spec-path-or-url]
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const SPEC = process.argv[2] ?? 'https://polar.sh/docs/openapi/2026-10.openapi.json';
const spec = SPEC.startsWith('http')
	? await (await fetch(SPEC)).json()
	: JSON.parse(await readFile(SPEC, 'utf8'));

// Endpoints the Polar node deliberately doesn't cover (see the Lot 3a spec, "Out of scope").
const EXCLUDED_PREFIXES = ['/customer-portal/', '/oauth2/', '/checkouts/client/'];
const EXCLUDED_OPS = new Set(['POST /organizations']);

const norm = (url) =>
	url
		.replace(/^=/, '')
		.replace(/^\/v1/, '')
		.replace(/\{\{[^}]*\}\}|\{[^}]+\}/g, '{}')
		.replace(/\/$/, '');

const specOps = new Map();
for (const [path, methods] of Object.entries(spec.paths)) {
	for (const [method, op] of Object.entries(methods)) {
		if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
		const oat = (op.security ?? []).find((s) => s.oat)?.oat ?? null;
		specOps.set(`${method.toUpperCase()} ${norm(path)}`, oat && oat.length ? [...oat].sort() : null);
	}
}

const { Polar } = require('../dist/nodes/Polar/Polar.node.js');
const properties = new Polar().description.properties;

const nodeOps = new Map(); // key -> { resource, operation, request }
for (const prop of properties) {
	if (prop.name !== 'operation' || prop.type !== 'options') continue;
	const resource = prop.displayOptions.show.resource[0];
	for (const option of prop.options) {
		const request = option.routing?.request;
		if (!request) continue;
		nodeOps.set(`${request.method} ${norm(request.url)}`, { resource, operation: option.value, request });
	}
}

const notices = new Map(); // "resource.operation" -> sorted scopes
for (const prop of properties) {
	if (prop.type !== 'notice' || !prop.name.endsWith('ScopeNotice')) continue;
	const { resource, operation } = prop.displayOptions.show;
	const scopes = [...prop.displayName.matchAll(/`([^`]+)`/g)].map((m) => m[1]).sort();
	notices.set(`${resource[0]}.${operation[0]}`, scopes);
}

const problems = [];
for (const [key, { resource, operation, request }] of nodeOps) {
	if (!specOps.has(key)) {
		problems.push(`NOT IN API  ${key}  (${resource}.${operation})`);
		continue;
	}
	const expected = specOps.get(key);
	const actual = notices.get(`${resource}.${operation}`) ?? null;
	if (JSON.stringify(expected) !== JSON.stringify(actual)) {
		problems.push(
			`SCOPES      ${resource}.${operation}: spec ${JSON.stringify(expected)} vs node ${JSON.stringify(actual)}`,
		);
	}
	if (/\/export$|^GET \/metrics$/.test(key) && request.arrayFormat !== 'repeat') {
		problems.push(`ARRAYFORMAT ${resource}.${operation} must set arrayFormat: 'repeat'`);
	}
}
for (const key of specOps.keys()) {
	const path = key.slice(key.indexOf(' ') + 1);
	if (EXCLUDED_OPS.has(key) || EXCLUDED_PREFIXES.some((p) => path.startsWith(p))) continue;
	if (!nodeOps.has(key)) problems.push(`MISSING     ${key}`);
}

const { webhookEventTypeOptions } = require('../dist/nodes/Polar/shared/descriptions.js');
const nodeEvents = new Set(webhookEventTypeOptions.map((o) => o.value));
const specEvents = spec.components.schemas.WebhookEventType.enum;
for (const e of specEvents) if (!nodeEvents.has(e)) problems.push(`EVENTS      missing ${e}`);
for (const e of nodeEvents) if (!specEvents.includes(e)) problems.push(`EVENTS      not in API ${e}`);

for (const p of problems) console.log(p);
console.log(`\n${nodeOps.size} node operations, ${specOps.size} spec operations, ${problems.length} problem(s)`);
process.exit(problems.length ? 1 : 0);
