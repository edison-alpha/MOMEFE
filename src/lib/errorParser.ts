/**
 * Parse smart contract error messages into user-friendly messages
 */

// Map of contract error codes to user-friendly messages
const CONTRACT_ERRORS: Record<string, { title: string; description: string }> = {
  // Raffle errors
  'E_ALREADY_CLAIMED': {
    title: 'Already Claimed',
    description: 'This prize has already been claimed.',
  },
  'E_NOT_WINNER': {
    title: 'Not the Winner',
    description: 'Only the winner can claim this prize.',
  },
  'E_RAFFLE_NOT_ENDED': {
    title: 'Raffle Still Active',
    description: 'This raffle has not ended yet.',
  },
  'E_RAFFLE_ENDED': {
    title: 'Raffle Ended',
    description: 'This raffle has already ended.',
  },
  'E_INVALID_TICKET_COUNT': {
    title: 'Invalid Ticket Count',
    description: 'Please enter a valid number of tickets.',
  },
  'E_NOT_ENOUGH_TICKETS': {
    title: 'Not Enough Tickets',
    description: 'Not enough tickets available.',
  },
  'E_RAFFLE_NOT_FOUND': {
    title: 'Raffle Not Found',
    description: 'This raffle does not exist.',
  },
  'E_NOT_CREATOR': {
    title: 'Not Authorized',
    description: 'Only the raffle creator can perform this action.',
  },
  'E_TICKETS_SOLD': {
    title: 'Cannot Cancel',
    description: 'Cannot cancel raffle after tickets have been sold.',
  },
  'E_ALREADY_FINALIZED': {
    title: 'Already Finalized',
    description: 'This raffle has already been finalized.',
  },
  'E_TARGET_NOT_MET': {
    title: 'Target Not Met',
    description: 'The raffle target amount was not reached.',
  },
  'E_NO_TICKETS_SOLD': {
    title: 'No Tickets Sold',
    description: 'No tickets have been sold for this raffle.',
  },
  'E_ASSET_NOT_IN_ESCROW': {
    title: 'Asset Not Available',
    description: 'The prize asset is not in escrow.',
  },
  'E_INSUFFICIENT_BALANCE': {
    title: 'Insufficient Balance',
    description: 'You don\'t have enough MOVE to complete this transaction.',
  },
  'EINSUFFICIENT_BALANCE': {
    title: 'Insufficient Balance',
    description: 'You don\'t have enough MOVE to complete this transaction.',
  },
};

// Common error patterns
const ERROR_PATTERNS: Array<{ pattern: RegExp; title: string; description: string }> = [
  {
    pattern: /insufficient.*balance|not enough/i,
    title: 'Insufficient Balance',
    description: 'You don\'t have enough MOVE to complete this transaction.',
  },
  {
    pattern: /user.*reject|user.*denied|cancelled|canceled/i,
    title: 'Transaction Cancelled',
    description: 'You cancelled the transaction.',
  },
  {
    pattern: /network|timeout|connection/i,
    title: 'Network Error',
    description: 'Please check your internet connection and try again.',
  },
  {
    pattern: /already.*claimed/i,
    title: 'Already Claimed',
    description: 'This prize has already been claimed.',
  },
];

export interface ParsedError {
  title: string;
  description: string;
  isUserFriendly: boolean;
}

/**
 * Parse error message from smart contract or transaction
 */
export function parseContractError(error: string | Error): ParsedError {
  const errorMessage = typeof error === 'string' ? error : error.message || String(error);
  
  // Check for Move abort errors (e.g., "E_ALREADY_CLAIMED(0xd)")
  const moveAbortMatch = errorMessage.match(/Move abort.*?:?\s*(\w+)\s*\(/i);
  if (moveAbortMatch) {
    const errorCode = moveAbortMatch[1];
    const knownError = CONTRACT_ERRORS[errorCode];
    if (knownError) {
      return { ...knownError, isUserFriendly: true };
    }
  }

  // Check for error code in message
  for (const [code, info] of Object.entries(CONTRACT_ERRORS)) {
    if (errorMessage.includes(code)) {
      return { ...info, isUserFriendly: true };
    }
  }

  // Check for common error patterns
  for (const { pattern, title, description } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return { title, description, isUserFriendly: true };
    }
  }

  // Default: return truncated error message
  const truncated = errorMessage.length > 100 
    ? errorMessage.substring(0, 100) + '...' 
    : errorMessage;
  
  return {
    title: 'Transaction Failed',
    description: truncated,
    isUserFriendly: false,
  };
}

/**
 * Get user-friendly error message for toast
 */
export function getErrorMessage(error: string | Error): { title: string; description: string } {
  const parsed = parseContractError(error);
  return { title: parsed.title, description: parsed.description };
}
