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

test('Order and Subscription export date filters send an ISO string with a UTC offset', () => {
	const cases = [
		{ resource: 'order', operation: 'export', name: 'created_after' },
		{ resource: 'order', operation: 'export', name: 'created_before' },
		{ resource: 'subscription', operation: 'export', name: 'started_after' },
		{ resource: 'subscription', operation: 'export', name: 'started_before' },
	];
	for (const { resource, operation, name } of cases) {
		const filters = properties.find(
			(p) =>
				p.name === 'filters' &&
				p.displayOptions?.show?.resource?.[0] === resource &&
				p.displayOptions?.show?.operation?.[0] === operation,
		);
		assert.ok(filters, `missing filters collection for ${resource}/${operation}`);
		const option = filters.options.find((o) => o.name === name);
		assert.ok(option, `missing filter option "${name}" for ${resource}/${operation}`);
		assert.equal(
			option.routing.request.qs[name],
			'={{ DateTime.fromISO(String($value)).toISO() }}',
			`unexpected qs expression for ${resource}/${operation}/${name}`,
		);
	}
});
