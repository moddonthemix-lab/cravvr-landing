/**
 * Shared formatting utilities for the Cravrr app
 */

/**
 * Format a date string as a relative time (e.g., "2 hours ago")
 *
 * @param {string} dateString - ISO date string
 * @param {string} precision - 'minutes' | 'days' | 'auto' (default: 'auto')
 * @returns {string} Human-readable relative time
 */
export const formatRelativeTime = (dateString, precision = 'auto') => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  // Auto precision: use minutes for recent, days for older
  if (precision === 'auto') {
    precision = diffDays < 1 ? 'minutes' : 'days';
  }

  if (precision === 'minutes') {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} days ago`;
  }

  // Days precision
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${diffWeeks} weeks ago`;
  return `${diffMonths} months ago`;
};

/**
 * Format a date as a friendly date string
 *
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeTime - Include time in output
 * @param {boolean} options.useRelative - Use "Today"/"Yesterday" for recent dates
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  const { includeTime = false, useRelative = true } = options;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);

  if (useRelative) {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (includeTime) {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} at ${timeStr}`;
  }

  return dateStr;
};

/**
 * Format a number as currency
 *
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format a number as a compact notation (e.g., 1.2k, 3.4M)
 *
 * @param {number} num - The number to format
 * @returns {string} Compact formatted number
 */
export const formatCompactNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num);
};

/**
 * Format a phone number to (XXX) XXX-XXXX format
 *
 * @param {string} phone - The phone number
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

export default {
  formatRelativeTime,
  formatDate,
  formatCurrency,
  formatCompactNumber,
  formatPhone
};
