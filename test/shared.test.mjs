import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { handlePolarApiError } = require('../dist/nodes/Polar/shared/errorHandling.js');
const { csvToBinary } = require('../dist/nodes/Polar/shared/binary.js');

const fakeThis = {
	getNodeParameter: (name) => ({ resource: 'order', operation: 'export' })[name],
	getNode: () => ({ id: '1', name: 'Polar', type: 'polar', typeVersion: 1, position: [0, 0], parameters: {} }),
	helpers: {
		prepareBinaryData: async (buffer, fileName, mimeType) => ({
			data: buffer.toString('base64'),
			fileName,
			mimeType,
		}),
	},
};

test('handlePolarApiError surfaces Polar detail from a Buffer body (export endpoints)', async () => {
	const body = Buffer.from(JSON.stringify({ detail: 'created_after must include a UTC offset' }));
	await assert.rejects(
		() => handlePolarApiError.call(fakeThis, [], { statusCode: 422, headers: {}, body }),
		(error) => {
			assert.match(error.description, /created_after must include a UTC offset/);
			return true;
		},
	);
});

test('handlePolarApiError passes successful responses through untouched', async () => {
	const items = [{ json: { ok: true } }];
	assert.equal(await handlePolarApiError.call(fakeThis, items, { statusCode: 200, headers: {}, body: {} }), items);
});

test('csvToBinary turns CSV bytes into one binary item', async () => {
	const csv = 'email,status\na@b.co,paid\n';
	const [item] = await csvToBinary('orders-export.csv').call(fakeThis, [], {
		statusCode: 200,
		headers: {},
		body: Buffer.from(csv),
	});
	assert.equal(item.binary.data.fileName, 'orders-export.csv');
	assert.equal(item.binary.data.mimeType, 'text/csv');
	assert.equal(Buffer.from(item.binary.data.data, 'base64').toString(), csv);
	assert.equal(item.json.size, Buffer.byteLength(csv));
});

test('csvToBinary still emits one item for an empty export', async () => {
	const items = await csvToBinary('customers-export.csv').call(fakeThis, [], {
		statusCode: 200,
		headers: {},
		body: Buffer.alloc(0),
	});
	assert.equal(items.length, 1);
	assert.equal(items[0].json.size, 0);
});
