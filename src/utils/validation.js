// Email validation (RFC 5322 compliant)
export const isValidEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Password validation
export const isStrongPassword = (password) => {
  // At least 12 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  return re.test(password);
};

// Check for common passwords
export const isCommonPassword = (password) => {
  const commonPasswords = [
    'password', '123456', '12345678', '123456789', '12345',
    '1234567', '1234567890', 'qwerty', 'abc123', 'password1'
  ];
  return commonPasswords.includes(password.toLowerCase());
};

// Sanitize user input
export const sanitizeInput = (input) => {
  // Remove any HTML/script tags
  return input.replace(/<[^>]*>?/gm, '').trim();
};

// Validate name (no special characters, emojis, etc.)
export const isValidName = (name) => {
  // Only allow letters, spaces, hyphens, and apostrophes
  const re = /^[a-zA-Z\s'-]+$/;
  return re.test(name);
};

// Check if email domain is disposable
// Note: This is a basic check. For production, use a dedicated service.
export const isDisposableEmail = async (email) => {
  const disposableDomains = [
    'tempmail.com', 'mailinator.com', 'guerrillamail.com', '10minutemail.com',
    'yopmail.com', 'maildrop.cc', 'tempmail.org', 'getnada.com', 'dispostable.com',
    'mailnesia.com', 'throwawaymail.com', 'temp-mail.org', 'mailinator.net', 'sharklasers.com'
  ];
  
  const domain = email.split('@')[1];
  return disposableDomains.includes(domain.toLowerCase());
};

// Check if email domain has valid MX records
export const hasValidMxRecord = async (email) => {
  try {
    const domain = email.split('@')[1];
    // This is a client-side check. For a real implementation, you'd need a backend service
    // that can perform DNS lookups, as browsers don't support direct DNS lookups.
    // This is a placeholder that assumes the domain is valid.
    return domain && domain.includes('.');
  } catch (error) {
    console.error('Error checking MX record:', error);
    return false;
  }
};
