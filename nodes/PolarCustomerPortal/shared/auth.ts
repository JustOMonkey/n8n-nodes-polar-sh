import type { IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

/**
 * `preSend` hook wired onto the node's Customer Session Token field. Customer portal endpoints
 * authenticate with a short-lived customer (or member) session token instead of the
 * Organization Access Token, so it can't live in a credential. A few endpoints (license key
 * validation/activation, organization lookup, email-change verification) are public, which is
 * why the header is only added when a token was actually provided.
 */
export async function addCustomerSessionToken(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const token = String(this.getNodeParameter('customerSessionToken', '') ?? '').trim();
	if (token) {
		requestOptions.headers = { ...(requestOptions.headers ?? {}), Authorization: `Bearer ${token}` };
	}
	return requestOptions;
}
