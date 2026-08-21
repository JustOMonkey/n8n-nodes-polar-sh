import type {
	IDataObject,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

// Scopes required per resource+operation, grounded in the `security.oat` requirement of each
// endpoint in Polar's versioned OpenAPI spec (https://polar.sh/docs/openapi/2026-10.openapi.json,
// checked 2026-08-21) — the actual machine-readable security requirement, not the free-text
// "**Scopes**:" line in the unversioned docs spec, which turned out to list the same scopes
// without making it clear they combine.
//
// When an endpoint's `oat` requirement lists more than one scope, ALL of them must be present
// on the token together (this is standard OpenAPI security-requirement semantics: scopes listed
// under one scheme in one requirement object are AND'd; only separate requirement objects, e.g.
// `oat` vs `pat`, are alternatives). That's why most read (get/list) operations below need BOTH
// the `:read` and `:write` scope, while write operations only need `:write` alone.
//
// `null` marks an operation with no `oat` security requirement at all (a public, invitation- or
// client-secret-based endpoint) — a 403 there isn't a token-scope issue.
// `organizationAccessToken`'s endpoints aren't present in the versioned spec (token management
// isn't exposed there); its scopes come from the unversioned spec's prose annotations instead,
// which are unambiguous single-scope entries.
const OPERATION_SCOPES: Record<string, Record<string, string[] | null>> = {
	benefit: {
		create: ['benefits:write'],
		delete: ['benefits:write'],
		get: ['benefits:read', 'benefits:write'],
		getGrants: ['benefits:read', 'benefits:write'],
		getAll: ['benefits:read', 'benefits:write'],
		update: ['benefits:write'],
	},
	benefitGrant: { getAll: ['benefits:read', 'benefits:write'] },
	checkout: {
		getAll: ['checkouts:read', 'checkouts:write'],
		get: ['checkouts:read', 'checkouts:write'],
		create: ['checkouts:write'],
		update: ['checkouts:write'],
	},
	checkoutLink: {
		create: ['checkout_links:write'],
		delete: ['checkout_links:write'],
		get: ['checkout_links:read', 'checkout_links:write'],
		getAll: ['checkout_links:read', 'checkout_links:write'],
		update: ['checkout_links:write'],
	},
	customField: {
		create: ['custom_fields:write'],
		delete: ['custom_fields:write'],
		get: ['custom_fields:read', 'custom_fields:write'],
		getAll: ['custom_fields:read', 'custom_fields:write'],
		update: ['custom_fields:write'],
	},
	customer: {
		create: ['customers:write'],
		delete: ['customers:write'],
		deleteExternal: ['customers:write'],
		get: ['customers:read', 'customers:write'],
		getExternal: ['customers:read', 'customers:write'],
		getAll: ['customers:read', 'customers:write'],
		getPaymentMethods: ['customers:read', 'customers:write'],
		getState: ['customers:read', 'customers:write'],
		getStateExternal: ['customers:read', 'customers:write'],
		update: ['customers:write'],
		updateExternal: ['customers:write'],
	},
	customerMeter: { get: ['customer_meters:read'], getAll: ['customer_meters:read'] },
	customerSeat: {
		assign: ['customer_seats:write'],
		claim: null,
		getClaimInfo: null,
		getAll: ['customer_seats:read'],
		resendInvitation: ['customer_seats:write'],
		revoke: ['customer_seats:write'],
	},
	customerSession: { create: ['customer_sessions:write'] },
	discount: {
		create: ['discounts:write'],
		delete: ['discounts:write'],
		get: ['discounts:read', 'discounts:write'],
		getAll: ['discounts:read', 'discounts:write'],
		update: ['discounts:write'],
	},
	dispute: {
		get: ['disputes:read', 'disputes:write'],
		getAll: ['disputes:read', 'disputes:write'],
	},
	event: {
		get: ['events:read', 'events:write'],
		getAll: ['events:read', 'events:write'],
		ingest: ['events:write'],
		listNames: ['events:read', 'events:write'],
	},
	eventType: {
		getAll: ['events:read', 'events:write'],
		update: ['events:write'],
	},
	file: {
		completeUpload: ['files:write'],
		create: ['files:write'],
		delete: ['files:write'],
		getAll: ['files:read', 'files:write'],
		update: ['files:write'],
	},
	licenseKey: {
		activate: ['license_keys:write'],
		deactivate: ['license_keys:write'],
		get: ['license_keys:read', 'license_keys:write'],
		getActivation: ['license_keys:read', 'license_keys:write'],
		getAll: ['license_keys:read', 'license_keys:write'],
		update: ['license_keys:write'],
		validate: ['license_keys:write'],
	},
	member: {
		create: ['members:write'],
		delete: ['members:write'],
		get: ['members:read', 'members:write'],
		getByExternalId: ['members:read', 'members:write'],
		getAll: ['members:read', 'members:write'],
		update: ['members:write'],
	},
	meter: {
		create: ['meters:write'],
		get: ['meters:read', 'meters:write'],
		getAll: ['meters:read', 'meters:write'],
		getQuantities: ['meters:read', 'meters:write'],
		update: ['meters:write'],
	},
	order: {
		create: ['orders:write'],
		finalize: ['orders:write'],
		generateInvoice: ['orders:read'],
		get: ['orders:read'],
		getInvoice: ['orders:read'],
		getAll: ['orders:read'],
		getReceipt: ['orders:read'],
		update: ['orders:write'],
	},
	organizationAccessToken: {
		create: ['organization_access_tokens:write'],
		delete: ['organization_access_tokens:write'],
		getAll: ['organization_access_tokens:read'],
		update: ['organization_access_tokens:write'],
	},
	payment: { get: ['payments:read'], getAll: ['payments:read'] },
	product: {
		create: ['products:write'],
		get: ['products:read', 'products:write'],
		getAll: ['products:read', 'products:write'],
		update: ['products:write'],
		updateBenefits: ['products:write'],
	},
	refund: {
		getAll: ['refunds:read', 'refunds:write'],
		create: ['refunds:write'],
	},
	subscription: {
		cancel: ['subscriptions:write'],
		clearPendingUpdate: ['subscriptions:write'],
		create: ['subscriptions:write'],
		get: ['subscriptions:read', 'subscriptions:write'],
		getAll: ['subscriptions:read', 'subscriptions:write'],
		pause: ['subscriptions:write'],
		resume: ['subscriptions:write'],
		revoke: ['subscriptions:write'],
		update: ['subscriptions:write'],
		updateBillingPeriod: ['subscriptions:write'],
		updateSeats: ['subscriptions:write'],
	},
	webhookDelivery: {
		getAll: ['webhooks:read', 'webhooks:write'],
		redeliver: ['webhooks:write'],
	},
	webhookEndpoint: {
		create: ['webhooks:write'],
		delete: ['webhooks:write'],
		get: ['webhooks:read', 'webhooks:write'],
		getAll: ['webhooks:read', 'webhooks:write'],
		resetSecret: ['webhooks:write'],
		update: ['webhooks:write'],
	},
};

function requiredScopes(resource: string, operation: string): string[] | null {
	const scopes = OPERATION_SCOPES[resource]?.[operation];
	return scopes && scopes.length ? scopes : null;
}

function formatScopeList(scopes: string[]): string {
	const codes = scopes.map((s) => `\`${s}\``);
	if (codes.length === 1) return codes[0];
	return `${codes.slice(0, -1).join(', ')} and ${codes[codes.length - 1]}`;
}

/**
 * Generates a `notice` field per operation that needs Polar scopes, so the requirement is
 * visible up front in the node UI instead of only surfacing after a 403. Call once per
 * resource, right after that resource's operation dropdown.
 */
export function scopeNoticesForResource(resource: string): INodeProperties[] {
	const operations = Object.keys(OPERATION_SCOPES[resource] ?? {});
	const notices: INodeProperties[] = [];
	for (const operation of operations) {
		const scopes = requiredScopes(resource, operation);
		if (!scopes) continue;
		const plural = scopes.length > 1 ? 'scopes' : 'scope';
		notices.push({
			displayName: `Requires the ${formatScopeList(scopes)} ${plural} on your Polar Access Token`,
			name: `${operation}ScopeNotice`,
			type: 'notice',
			default: '',
			displayOptions: { show: { resource: [resource], operation: [operation] } },
		});
	}
	return notices;
}

function statusMessage(
	statusCode: number,
	resource: string,
	operation: string,
): { message: string; description: string } {
	if (statusCode === 401) {
		return {
			message: 'Invalid or expired Polar access token',
			description:
				'Check the Access Token in your Polar API credential. Generate a new Organization Access Token from the Polar dashboard (Settings → Access Tokens) if it has expired or been revoked.',
		};
	}
	if (statusCode === 403) {
		const scopes = requiredScopes(resource, operation);
		return {
			message: "Your Polar Access Token doesn't have permission to do this",
			description: scopes
				? `This operation requires the ${formatScopeList(scopes)} ${scopes.length > 1 ? 'scopes' : 'scope'} together on the token. Edit your Organization Access Token in the Polar dashboard (or use the Organization Access Token resource in this node) to add ${scopes.length > 1 ? 'them' : 'it'}.`
				: "This endpoint doesn't require a Polar API scope — a 403 here isn't a token permission issue (e.g. an invalid or expired invitation token).",
		};
	}
	if (statusCode === 404) {
		return {
			message: 'Not found',
			description:
				"Double-check the ID, and make sure you're using the right environment — Sandbox and Production have completely separate data (set on the credential).",
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

/**
 * Shared `postReceive` handler wired onto every operation's `routing.request` (alongside
 * `ignoreHttpStatusErrors: true`, which is what makes error responses reach this function
 * instead of being turned into a generic NodeApiError before we see them).
 */
export async function handlePolarApiError(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	if (response.statusCode < 400) return items;

	const resource = this.getNodeParameter('resource', '') as string;
	const operation = this.getNodeParameter('operation', '') as string;
	const { message, description } = statusMessage(response.statusCode, resource, operation);

	const body = (response.body ?? {}) as IDataObject;
	const detail = typeof body.detail === 'string' ? body.detail : undefined;

	throw new NodeApiError(this.getNode(), body as JsonObject, {
		message,
		description: detail ? `${description}\n\nPolar says: "${detail}"` : description,
		httpCode: String(response.statusCode),
	});
}
