import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { fileGetAllDescription } from './getAll';
import { fileCreateDescription } from './create';
import { fileCompleteUploadDescription } from './completeUpload';
import { fileUpdateDescription } from './update';
import { fileDeleteDescription } from './delete';

const showOnlyForFile = { resource: ['file'] };

export const fileDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForFile },
		options: [
			{
				name: 'Complete Upload',
				value: 'completeUpload',
				action: 'Complete a file upload',
				description: 'Report the completed S3 multipart upload parts back to Polar',
				routing: {
					request: {
						method: 'POST',
						url: '=/files/{{$parameter["fileId"]}}/uploaded',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a file',
				description: 'Declare a new file and its upload parts, returning presigned S3 upload URLs',
				routing: {
					request: { method: 'POST', url: '=/files/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a file',
				description: 'Delete a file',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/files/{{$parameter["fileId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many files',
				description: 'Get many files',
				routing: {
					request: { method: 'GET', url: '=/files/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a file',
				description: 'Update an existing file',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/files/{{$parameter["fileId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('file'),
	...fileGetAllDescription,
	...fileCreateDescription,
	...fileCompleteUploadDescription,
	...fileUpdateDescription,
	...fileDeleteDescription,
];
