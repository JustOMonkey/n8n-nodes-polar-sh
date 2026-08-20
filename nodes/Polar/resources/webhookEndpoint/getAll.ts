import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['webhookEndpoint'], operation: ['getAll'] };

export const webhookEndpointGetAllDescription: INodeProperties[] = [...paginationProperties(show)];
