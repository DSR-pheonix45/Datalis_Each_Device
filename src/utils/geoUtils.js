export const getUserLocation = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }
    const data = await response.json();
    return {
      country: data.country_name,
      countryCode: data.country_code,
      currency: data.currency,
      ip: data.ip
    };
  } catch (error) {
    console.error('Error fetching user location:', error);
    // Default fallback
    return {
      country: 'Unknown',
      countryCode: 'US',
      currency: 'USD',
      ip: null
    };
  }
};

export const getCurrencyForCountry = (countryCode) => {
  const currencyMap = {
    'IN': 'INR',
    'AE': 'AED',
    'US': 'USD',
    'GB': 'GBP',
    'EU': 'EUR',
    // Add more as needed
  };
  return currencyMap[countryCode] || 'USD';
};
