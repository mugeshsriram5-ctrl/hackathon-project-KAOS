/**
 * Centralized KAOS Handle Validation & Normalization Utility
 * Strictly enforces all KAOS platform handle constraints.
 */

export const RESERVED_HANDLES = new Set([
  'admin',
  'administrator',
  'kaos',
  'kaos_official',
  'kaos_bot',
  'official',
  'support',
  'help',
  'system',
  'moderator',
  'mod',
  'security',
  'staff',
  'chennai_heritage',
  'null',
  'undefined',
  'root',
]);

export const PROHIBITED_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'crap',
  'cunt',
  'dick',
  'nigger',
  'faggot',
  'scam',
  'fake',
  'hacker',
];

export interface HandleValidationResult {
  isValid: boolean;
  error?: string;
  normalizedHandle: string;
}

/**
 * Normalizes a handle by trimming whitespace, stripping leading '@' if present, and converting to lowercase.
 */
export function normalizeHandle(rawHandle: string): string {
  if (!rawHandle) return '';
  let cleaned = rawHandle.trim();
  if (cleaned.startsWith('@')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned.toLowerCase();
}

/**
 * Validates a KAOS handle against all platform rules.
 */
export function validateHandle(rawHandle: string): HandleValidationResult {
  const normalized = normalizeHandle(rawHandle);

  if (!normalized) {
    return { isValid: false, error: 'Please enter a handle.', normalizedHandle: '' };
  }

  if (normalized.length < 3) {
    return { isValid: false, error: 'Handle must be at least 3 characters.', normalizedHandle: normalized };
  }

  if (normalized.length > 20) {
    return { isValid: false, error: 'Handle must be 20 characters or fewer.', normalizedHandle: normalized };
  }

  // Check for allowed characters only (lowercase letters, digits, underscores)
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    // Check if uppercase letters were entered before normalization
    if (/[A-Z]/.test(rawHandle)) {
      return { isValid: false, error: 'Handle must use lowercase letters.', normalizedHandle: normalized };
    }
    if (/\s/.test(rawHandle)) {
      return { isValid: false, error: 'Handle cannot contain spaces.', normalizedHandle: normalized };
    }
    return { isValid: false, error: 'Handle can only contain lowercase letters, numbers, and underscores.', normalizedHandle: normalized };
  }

  if (normalized.startsWith('_')) {
    return { isValid: false, error: 'Handle cannot start with an underscore.', normalizedHandle: normalized };
  }

  if (normalized.endsWith('_')) {
    return { isValid: false, error: 'Handle cannot end with an underscore.', normalizedHandle: normalized };
  }

  if (/__/.test(normalized)) {
    return { isValid: false, error: 'Handle cannot contain consecutive underscores.', normalizedHandle: normalized };
  }

  // Handle cannot consist only of numbers
  if (/^\d+$/.test(normalized)) {
    return { isValid: false, error: 'Handle must contain at least one letter.', normalizedHandle: normalized };
  }

  // Reserved handles check
  if (RESERVED_HANDLES.has(normalized)) {
    return { isValid: false, error: 'This handle is unavailable. Please choose another.', normalizedHandle: normalized };
  }

  // Profanity check
  for (const word of PROHIBITED_WORDS) {
    if (normalized.includes(word)) {
      return { isValid: false, error: 'This handle cannot be used. Please choose another.', normalizedHandle: normalized };
    }
  }

  return { isValid: true, normalizedHandle: normalized };
}
