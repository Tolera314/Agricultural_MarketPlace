/**
 * Centralized Client-Side Error Normalizer & Plain-English Error Translator — AgriMarket
 *
 * Translates network failures, HTTP statuses, API error payloads, and edge cases
 * into human-readable, plain English messages suitable for ordinary end users.
 * Strips raw HTML, JSON syntax, internal exception codes, and stack traces.
 */

export interface NormalizedApiError {
  code?: string;
  message: string;
  field?: string;
  fieldErrors?: Record<string, string>;
  status?: number;
}

/**
 * Maps HTTP status codes to polite, actionable plain-English explanations.
 */
export function getMessageForHttpStatus(status: number): string {
  switch (status) {
    case 400:
      return 'The submitted information is incomplete or invalid. Please check your entries and try again.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource or page could not be found.';
    case 408:
      return 'This request timed out. Please check your connection and try again.';
    case 409:
      return 'This action conflicts with existing data. Please refresh and try again.';
    case 413:
      return 'The uploaded file is too large. Please select a file under 5 MB.';
    case 415:
      return 'This file format is not supported. Please upload a JPEG, PNG, WebP image, or PDF document.';
    case 422:
      return 'We could not process your submission. Please correct the highlighted fields.';
    case 429:
      return 'Too many requests. Please wait a few seconds before trying again.';
    case 500:
      return 'Something went wrong on our end. Please try again shortly. If the issue continues, contact support.';
    case 502:
    case 503:
    case 504:
      return 'Our services are temporarily unavailable or undergoing maintenance. Please try again in a moment.';
    default:
      return 'An unexpected issue occurred. Please check your connection and try again.';
  }
}

/**
 * Returns a clean, human-readable plain-English error message from any error object.
 */
export function getHumanReadableErrorMessage(err: unknown, defaultFallback = 'Something went wrong. Please try again.'): string {
  if (!err) return defaultFallback;

  // 1. Direct string
  if (typeof err === 'string') {
    const trimmed = err.trim();
    if (!trimmed) return defaultFallback;

    // Check for raw HTML error pages (e.g. 502 Bad Gateway from reverse proxy)
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('<body')) {
      return 'Our servers are temporarily busy or undergoing maintenance. Please try again shortly.';
    }

    // Check for raw JSON strings
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return getHumanReadableErrorMessage(parsed, defaultFallback);
      } catch {
        // Not valid JSON, continue
      }
    }

    // Technical code translations
    if (trimmed === 'AUTH_REQUIRED') {
      return 'Please sign in to continue.';
    }
    if (trimmed.includes('Failed to fetch') || trimmed.includes('NetworkError') || trimmed.includes('ERR_CONNECTION_REFUSED')) {
      return 'Unable to connect to AgriMarket. Please check your internet connection and try again.';
    }
    if (trimmed.includes('AbortError') || trimmed.includes('timeout')) {
      return 'This operation is taking longer than expected. Please try again.';
    }

    return trimmed;
  }

  // 2. Error object
  if (typeof err === 'object') {
    const anyErr = err as any;

    // Check nested API error format: { error: { message, code, field } }
    if (anyErr.error) {
      if (typeof anyErr.error === 'string') {
        return getHumanReadableErrorMessage(anyErr.error, defaultFallback);
      }
      if (anyErr.error.message && typeof anyErr.error.message === 'string') {
        return getHumanReadableErrorMessage(anyErr.error.message, defaultFallback);
      }
    }

    // Standard Error.message
    if (typeof anyErr.message === 'string' && anyErr.message.trim()) {
      const msg = anyErr.message.trim();

      // Check for browser network fetch errors
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('ERR_CONNECTION_REFUSED') ||
        anyErr.name === 'TypeError' && msg.includes('fetch')
      ) {
        return 'Unable to connect. Please check your internet connection and try again.';
      }

      // Check for timeout / abort
      if (anyErr.name === 'AbortError' || msg.includes('timed out')) {
        return 'This is taking longer than expected. Please try again.';
      }

      // Check for HTML or JSON parsing failure
      if (msg.includes('Unexpected token') && (msg.includes('<') || msg.includes('JSON'))) {
        return 'The server returned an unexpected response. Please refresh the page and try again.';
      }

      // Check for raw status string like "Request failed with status 500"
      const statusMatch = msg.match(/Request failed(?:\s+with status)?\s*:?\s*(\d{3})/i);
      if (statusMatch && statusMatch[1]) {
        return getMessageForHttpStatus(parseInt(statusMatch[1], 10));
      }

      // Check for technical error codes
      if (msg === 'AUTH_REQUIRED') {
        return 'Please sign in to continue.';
      }

      return msg;
    }

    // Status code without message
    if (typeof anyErr.status === 'number') {
      return getMessageForHttpStatus(anyErr.status);
    }
  }

  return defaultFallback;
}

/**
 * Safely parses any fetch Response, guaranteeing that HTML error pages or network
 * failures do NOT trigger unhandled JSON syntax errors or crash the UI.
 */
export async function safeParseApiResponse<T = any>(
  res: Response
): Promise<{
  ok: boolean;
  status: number;
  data?: T;
  error?: NormalizedApiError;
}> {
  const status = res.status;
  const isOk = res.ok;

  let text = '';
  try {
    text = await res.text();
  } catch {
    return {
      ok: false,
      status,
      error: {
        message: 'Could not read server response. Please check your internet connection.',
        status,
      },
    };
  }

  // Attempt JSON parsing
  let json: any = null;
  if (text && text.trim()) {
    try {
      json = JSON.parse(text);
    } catch {
      // Not valid JSON (e.g. 502 HTML error page from proxy or platform)
      return {
        ok: false,
        status,
        error: {
          code: 'UNEXPECTED_RESPONSE',
          message: getMessageForHttpStatus(status),
          status,
        },
      };
    }
  }

  if (isOk) {
    return {
      ok: true,
      status,
      data: (json?.data !== undefined ? json.data : json) as T,
    };
  }

  // Error response: extract structured error details
  const errorObj = json?.error || {};
  const message =
    typeof errorObj === 'string'
      ? errorObj
      : errorObj.message || json?.message || getMessageForHttpStatus(status);

  return {
    ok: false,
    status,
    error: {
      code: errorObj.code || `HTTP_${status}`,
      message: getHumanReadableErrorMessage(message),
      field: errorObj.field,
      fieldErrors: errorObj.fieldErrors,
      status,
    },
  };
}

/**
 * Creates an Error subclass that carries normalized API error metadata.
 */
export class ApiClientError extends Error {
  public readonly code?: string;
  public readonly field?: string;
  public readonly fieldErrors?: Record<string, string>;
  public readonly status: number;

  constructor(normalized: NormalizedApiError) {
    super(normalized.message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiClientError';
    this.code = normalized.code;
    this.field = normalized.field;
    this.fieldErrors = normalized.fieldErrors;
    this.status = normalized.status || 500;
  }
}

