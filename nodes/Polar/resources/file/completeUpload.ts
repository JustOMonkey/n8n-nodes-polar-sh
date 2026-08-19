import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'], operation: ['completeUpload'] };

type CompletedPartEntry = {
	number: number;
	checksumEtag: string;
	checksumSha256Base64?: string;
};

function buildCompletedParts(parts: CompletedPartEntry[]) {
	return parts.map((p) => ({
		number: p.number,
		checksum_etag: p.checksumEtag,
		checksum_sha256_base64: p.checksumSha256Base64 || null,
	}));
}

export const fileCompleteUploadDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'id' } },
	},
	{
		displayName: 'Path',
		name: 'path',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The storage path Polar returned when the file was created',
		routing: { send: { type: 'body', property: 'path' } },
	},
	{
		displayName: 'Completed Parts',
		name: 'completedParts',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Part' },
		default: {},
		required: true,
		displayOptions: { show },
		description: "Each part's number, and the ETag/checksum returned by S3 when you PUT its bytes",
		options: [
			{
				displayName: 'Part',
				name: 'part',
				values: [
					{
						displayName: 'Checksum ETag',
						name: 'checksumEtag',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Checksum SHA256 (Base64)',
						name: 'checksumSha256Base64',
						type: 'string',
						default: '',
					},
					{ displayName: 'Number', name: 'number', type: 'number', default: 1, typeOptions: { minValue: 1 } },
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'parts',
				value: `={{ (${buildCompletedParts.toString()})(($parameter["completedParts"].part || []).map((p) => ({ number: p.number, checksumEtag: p.checksumEtag, checksumSha256Base64: p.checksumSha256Base64 }))) }}`,
			},
		},
	},
];
