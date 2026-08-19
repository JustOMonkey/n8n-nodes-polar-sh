import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'], operation: ['create'] };

type UploadPartEntry = {
	number: number;
	chunkStart: number;
	chunkEnd: number;
	checksumSha256Base64?: string;
};

function buildUploadParts(parts: UploadPartEntry[]) {
	return {
		parts: parts.map((p) => {
			const part: Record<string, unknown> = { number: p.number, chunk_start: p.chunkStart, chunk_end: p.chunkEnd };
			if (p.checksumSha256Base64) part.checksum_sha256_base64 = p.checksumSha256Base64;
			return part;
		}),
	};
}

export const fileCreateDescription: INodeProperties[] = [
	{
		displayName: 'Service',
		name: 'service',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Downloadable', value: 'downloadable' },
			{ name: 'Organization Avatar', value: 'organization_avatar' },
			{ name: 'Product Media', value: 'product_media' },
		],
		default: 'downloadable',
		description:
			'What this file is for. Organization Avatar and Product Media accept only image MIME types (jpeg/png/gif/webp/svg+xml) and are capped at 1 MB and 10 MB respectively; Downloadable accepts any MIME type with no fixed cap.',
		routing: { send: { type: 'body', property: 'service' } },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'MIME Type',
		name: 'mimeType',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'mime_type' } },
	},
	{
		displayName: 'Size (Bytes)',
		name: 'size',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: { minValue: 0, numberPrecision: 0 },
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'size' } },
	},
	{
		displayName: 'Upload Parts',
		name: 'uploadParts',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Part' },
		default: {},
		required: true,
		displayOptions: { show },
		description: 'Declare each S3 multipart upload part. Polar returns a presigned upload URL per part.',
		options: [
			{
				displayName: 'Part',
				name: 'part',
				values: [
					{
						displayName: 'Checksum SHA256 (Base64)',
						name: 'checksumSha256Base64',
						type: 'string',
						default: '',
					},
					{ displayName: 'Chunk End', name: 'chunkEnd', type: 'number', default: 0, typeOptions: { minValue: 0 } },
					{ displayName: 'Chunk Start', name: 'chunkStart', type: 'number', default: 0, typeOptions: { minValue: 0 } },
					{ displayName: 'Number', name: 'number', type: 'number', default: 1, typeOptions: { minValue: 1 } },
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'upload',
				value: `={{ (${buildUploadParts.toString()})(($parameter["uploadParts"].part || []).map((p) => ({ number: p.number, chunkStart: p.chunkStart, chunkEnd: p.chunkEnd, checksumSha256Base64: p.checksumSha256Base64 }))) }}`,
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Checksum SHA256 (Base64)',
				name: 'checksum_sha256_base64',
				type: 'string',
				default: '',
				routing: { request: { body: { checksum_sha256_base64: '={{$value}}' } } },
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'string',
				default: '',
				routing: { request: { body: { version: '={{$value}}' } } },
			},
		],
	},
];
