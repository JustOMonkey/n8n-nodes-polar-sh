import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestMethods,
	IN8nHttpFullResponse,
	INodeExecutionData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

function statusMessage(statusCode: number): { message: string; description: string } {
	if (statusCode === 401) {
		return {
			message: 'Invalid or expired customer session token',
			description:
				'Customer session tokens are short-lived. Create a fresh one with the Polar node (Customer Session → Create) and pass its `token` into this node\'s Customer Session Token field, e.g. with an expression.',
		};
	}
	if (statusCode === 403) {
		return {
			message: "This customer session isn't allowed to do this",
			description:
				"Member-management operations need a member session of an owner or billing manager, and some actions can be disabled in the organization's customer portal settings.",
		};
	}
	if (statusCode === 404) {
		return {
			message: 'Not found',
			description:
				"Double-check the ID, that it belongs to this customer, and that you're using the right environment — Sandbox and Production have completely separate data.",
		};
	}
	if (statusCode === 429) {
		return {
			message: 'Rate limited by the Polar API',
			description:
				'Too many requests were sent in a short period. Wait a moment and try again, or add a Wait node between retries.',
		};
	}
	return { message: 'Polar API request failed', description: '' };
}

function parseErrorBody(raw: unknown): IDataObject {
	const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw;
	if (typeof text === 'string') {
		try {
			return JSON.parse(text) as IDataObject;
		} catch {
			return { message: text };
		}
	}
	return (text ?? {}) as IDataObject;
}

/**
 * Shared `postReceive` handler for every Polar Customer Portal operation (paired with
 * `ignoreHttpStatusErrors: true` so error responses reach it).
 */
export async function handlePortalApiError(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	if (response.statusCode < 400) return items;

	const { message, description } = statusMessage(response.statusCode);
	const body = parseErrorBody(response.body);
	const detail = typeof body.detail === 'string' ? body.detail : undefined;

	throw new NodeApiError(this.getNode(), body as JsonObject, {
		message,
		description: detail ? `${description}\n\nPolar says: "${detail}"` : description,
		httpCode: String(response.statusCode),
	});
}

/**
 * Declarative routing for one portal operation: the request plus the shared error handler.
 * `body` is for operations that always send the same fixed payload (e.g. Resume).
 */
export function portalRouting(method: IHttpRequestMethods, url: string, body?: IDataObject) {
	return {
		request: { method, url, ignoreHttpStatusErrors: true, ...(body ? { body } : {}) },
		output: { postReceive: [handlePortalApiError] },
	};
}
