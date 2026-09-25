import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Polar } = require('../dist/nodes/Polar/Polar.node.js');
const properties = new Polar().description.properties;

const operationsOf = (resource) =>
	properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.[0] === resource);

test('Member keeps every legacy operation value so saved workflows still open', () => {
	const values = operationsOf('member').options.map((o) => o.value);
	for (const legacy of ['create', 'delete', 'get', 'getAll', 'getByExternalId', 'update']) {
		assert.ok(values.includes(legacy), `missing legacy Member operation "${legacy}"`);
	}
});

test('Member operations all target /customers/.../members', () => {
	for (const option of operationsOf('member').options) {
		assert.match(option.routing.request.url, /^=\/customers\/(external\/)?\{\{.+\}\}\/members/);
	}
});

test('Metric start/end dates are truncated to YYYY-MM-DD before sending', () => {
	for (const name of ['startDate', 'endDate']) {
		const prop = properties.find((p) => p.name === name && p.displayOptions?.show?.resource?.[0] === 'metric');
		assert.ok(prop, `missing metric ${name}`);
		assert.equal(prop.routing.send.value, '={{ String($value).slice(0, 10) }}');
	}
});

test('Metric Dashboard Get Many does not use pagination (bare array response)', () => {
	const paginated = properties.find(
		(p) => p.name === 'returnAll' && p.displayOptions?.show?.resource?.[0] === 'metricDashboard',
	);
	assert.equal(paginated, undefined);
});
