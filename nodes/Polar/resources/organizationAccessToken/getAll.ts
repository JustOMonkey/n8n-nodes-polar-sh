import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['organizationAccessToken'], operation: ['getAll'] };

export const organizationAccessTokenGetAllDescription: INodeProperties[] = [...paginationProperties(show)];
