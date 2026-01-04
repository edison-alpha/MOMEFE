/**
 * Utility functions untuk konversi timestamp dari Movement Indexer
 * 
 * Movement Indexer mengembalikan timestamp dalam format ISO 8601 string (UTC)
 * Contoh: "2025-12-22T14:32:46" (UTC time, perlu konversi ke local)
 * 
 * Fungsi-fungsi ini akan menampilkan waktu dalam timezone lokal user browser
 */

/**
 * Konversi timestamp dari Movement Indexer ke JavaScript Date
 * @param timestamp - Timestamp dalam format ISO 8601 string (UTC) atau number
 * @returns Date object
 */
export function parseIndexerTimestamp(timestamp: string | number): Date {
  if (!timestamp) {
    return new Date();
  }
  
  // Movement Indexer menggunakan ISO 8601 string format dalam UTC
  // Jika tidak ada Z suffix, tambahkan untuk menandakan UTC
  if (typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.includes('+')) {
    timestamp = timestamp + 'Z';
  }
  
  return new Date(timestamp);
}

/**
 * Format timestamp untuk tampilan dengan format lengkap (local timezone)
 * @param timestamp - Timestamp dalam format ISO 8601 string atau number
 * @returns Formatted string (e.g., "Dec 24, 2025, 08:39:12 PM")
 */
export function formatIndexerTimestamp(timestamp: string | number): string {
  const date = parseIndexerTimestamp(timestamp);
  return date.toLocaleString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format timestamp untuk tampilan singkat (selalu dengan tanggal dan waktu, local timezone)
 * @param timestamp - Timestamp dalam format ISO 8601 string atau number
 * @returns Formatted string (e.g., "Dec 24, 2025, 08:39 PM")
 */
export function formatIndexerTimestampShort(timestamp: string | number): string {
  const date = parseIndexerTimestamp(timestamp);
  
  // Selalu tampilkan tanggal dan waktu dalam local timezone
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Format timestamp untuk tampilan UTC
 * @param timestamp - Timestamp dalam format ISO 8601 string atau number
 * @returns Formatted string in UTC (e.g., "Dec 22, 2025, 02:32 PM UTC")
 */
export function formatIndexerTimestampUTC(timestamp: string | number): string {
  const date = parseIndexerTimestamp(timestamp);
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  });
}

/**
 * Format timestamp untuk tampilan relatif (e.g., "2 hours ago")
 * @param timestamp - Timestamp dalam format ISO 8601 string atau number
 * @returns Formatted string
 */
export function formatIndexerTimestampRelative(timestamp: string | number): string {
  const date = parseIndexerTimestamp(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  }
}
