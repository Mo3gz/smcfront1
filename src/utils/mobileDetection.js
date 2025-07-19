// Mobile browser detection utility
export const isMobileBrowser = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Check for mobile devices
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobileRegex.test(userAgent);
};

export const isIOS = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /iPad|iPhone|iPod/.test(userAgent);
};

export const isAndroid = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /Android/.test(userAgent);
};

export const getMobileBrowserInfo = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  if (isIOS()) {
    return {
      platform: 'iOS',
      isMobile: true,
      browser: userAgent.includes('Safari') ? 'Safari' : 'Other'
    };
  }
  
  if (isAndroid()) {
    return {
      platform: 'Android',
      isMobile: true,
      browser: userAgent.includes('Chrome') ? 'Chrome' : 'Other'
    };
  }
  
  return {
    platform: 'Desktop',
    isMobile: false,
    browser: 'Unknown'
  };
};

export const checkCookieSupport = () => {
  try {
    document.cookie = "testCookie=1";
    const hasCookie = document.cookie.indexOf("testCookie=") !== -1;
    document.cookie = "testCookie=1; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    return hasCookie;
  } catch (e) {
    return false;
  }
};

export const getMobileWarnings = () => {
  const warnings = [];
  const mobileInfo = getMobileBrowserInfo();
  
  if (mobileInfo.isMobile) {
    warnings.push(`Detected ${mobileInfo.platform} device`);
    
    if (!checkCookieSupport()) {
      warnings.push('Cookies are disabled. Please enable cookies for this site.');
    }
    
    if (mobileInfo.platform === 'iOS' && mobileInfo.browser === 'Safari') {
      warnings.push('Using Safari on iOS. Make sure to allow cross-site tracking.');
    }
    
    if (window.location.protocol !== 'https:') {
      warnings.push('Not using HTTPS. Some features may not work properly.');
    }
  }
  
  return warnings;
}; 