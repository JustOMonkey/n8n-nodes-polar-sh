import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PolarCustomerPortal } = require('../dist/nodes/PolarCustomerPortal/PolarCustomerPortal.node.js');
const { Polar } = require('../dist/nodes/Polar/Polar.node.js');
const { addCustomerSessionToken } = require('../dist/nodes/PolarCustomerPortal/shared/auth.js');
const {
	handlePortalApiError,
} = require('../dist/nodes/PolarCustomerPortal/shared/errorHandling.js');

const portalProperties = new PolarCustomerPortal().description.properties;

const withToken = (token) => ({
	getNodeParameter: (name) => (name === 'customerSessionToken' ? token : undefined),
	getNode: () => ({ id: '1', name: 'Portal', type: 'polarCustomerPortal', typeVersion: 1, position: [0, 0], parameters: {} }),
});

test('customer session token is sent as a Bearer header', async () => {
	const options = await addCustomerSessionToken.call(withToken(' polar_cst_abc '), {
		url: '/x',
		headers: { Accept: 'application/json' },
	});
	assert.equal(options.headers.Authorization, 'Bearer polar_cst_abc');
	assert.equal(options.headers.Accept, 'application/json');
});

test('no Authorization header is added for public operations without a token', async () => {
	const options = await addCustomerSessionToken.call(withToken('  '), { url: '/x', headers: {} });
	assert.equal(options.headers.Authorization, undefined);
});

test('the token field carries the preSend hook so every operation is authenticated', () => {
	const token = portalProperties.find((p) => p.name === 'customerSessionToken');
	assert.deepEqual(token.routing.send.preSend, [addCustomerSessionToken]);
	assert.equal(token.displayOptions, undefined, 'token must be shown (and thus routed) for every operation');
});

test('a 401 explains how to get a fresh customer session token', async () => {
	await assert.rejects(
		() =>
			handlePortalApiError.call(withToken('x'), [], {
				statusCode: 401,
				headers: {},
				body: Buffer.from(JSON.stringify({ detail: 'Token expired' })),
			}),
		(error) => {
			assert.equal(error.message, 'Invalid or expired customer session token');
			assert.match(error.description, /Customer Session → Create/);
			assert.match(error.description, /Token expired/);
			return true;
		},
	);
});

test('every portal operation ignores HTTP errors and routes them to the portal error handler', () => {
	for (const prop of portalProperties.filter((p) => p.name === 'operation')) {
		for (const option of prop.options) {
			assert.equal(option.routing.request.ignoreHttpStatusErrors, true, option.value);
			assert.deepEqual(option.routing.output.postReceive, [handlePortalApiError], option.value);
		}
	}
});

test('Subscription Resume and Clear Pending Update send their fixed payloads', () => {
	const ops = portalProperties.find(
		(p) => p.name === 'operation' && p.displayOptions.show.resource[0] === 'subscription',
	).options;
	assert.deepEqual(ops.find((o) => o.value === 'resume').routing.request.body, { resume: true });
	assert.deepEqual(ops.find((o) => o.value === 'clearPendingUpdate').routing.request.body, {
		pending_update: null,
	});
});

// Guards both nodes: a URL like `/orders/{{$parameter["orderId"]}}` breaks at runtime if the
// orderId field isn't displayed for that operation.
for (const [nodeName, properties] of [
	['Polar', new Polar().description.properties],
	['Polar Customer Portal', portalProperties],
]) {
	test(`${nodeName}: every parameter used in a URL is shown for that operation`, () => {
		for (const prop of properties.filter((p) => p.name === 'operation')) {
			const resource = prop.displayOptions.show.resource[0];
			for (const option of prop.options) {
				const url = option.routing?.request?.url ?? '';
				for (const [, param] of url.matchAll(/\$parameter\["([^"]+)"\]/g)) {
					const shown = properties.some(
						(p) =>
							p.name === param &&
							p.displayOptions?.show?.resource?.includes(resource) &&
							p.displayOptions?.show?.operation?.includes(option.value),
					);
					assert.ok(shown, `${resource}.${option.value} uses "${param}" but no such field is shown`);
				}
			}
		}
	});
}
