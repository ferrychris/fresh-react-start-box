// Network diagnostics utility for QUIC protocol error detection
export interface NetworkDiagnostics {
  protocol: 'http1' | 'http2' | 'quic' | 'unknown';
  isQuicEnabled: boolean;
  connectionType: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export const getNetworkDiagnostics = (): NetworkDiagnostics => {
  const diagnostics: NetworkDiagnostics = {
    protocol: 'unknown',
    isQuicEnabled: false,
    connectionType: 'unknown'
  };

  // Check if QUIC is enabled (Chrome-specific)
  if (typeof window !== 'undefined' && window.chrome) {
    try {
      const loadTimes = (window.chrome as any).loadTimes?.();
      if (loadTimes?.connectionInfo) {
        if (loadTimes.connectionInfo.includes('quic')) {
          diagnostics.protocol = 'quic';
          diagnostics.isQuicEnabled = true;
        } else if (loadTimes.connectionInfo.includes('h2')) {
          diagnostics.protocol = 'http2';
        } else {
          diagnostics.protocol = 'http1';
        }
      }
    } catch (error) {
      console.warn('Could not detect QUIC status:', error);
    }
  }

  // Get network connection info
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    diagnostics.connectionType = connection.type || 'unknown';
    diagnostics.effectiveType = connection.effectiveType;
    diagnostics.downlink = connection.downlink;
    diagnostics.rtt = connection.rtt;
  }

  return diagnostics;
};

export const logNetworkDiagnostics = () => {
  const diagnostics = getNetworkDiagnostics();
  console.log('🔍 Network Diagnostics:', diagnostics);
  return diagnostics;
};

export const isQuicProtocolError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  return errorMessage.includes('ERR_QUIC_PROTOCOL_ERROR') ||
         errorMessage.includes('QUIC') ||
         error.code === 'NETWORK_ERROR';
};

export const shouldUseChunkedUpload = (payloadSize: number, networkDiagnostics?: NetworkDiagnostics): boolean => {
  const diagnostics = networkDiagnostics || getNetworkDiagnostics();
  
  // Use chunked upload for QUIC if payload > 1MB
  if (diagnostics.isQuicEnabled && payloadSize > 1024 * 1024) {
    return true;
  }
  
  // Use chunked upload for slow connections if payload > 5MB
  if (diagnostics.effectiveType === 'slow-2g' || diagnostics.effectiveType === '2g') {
    return payloadSize > 5 * 1024 * 1024;
  }
  
  // Default threshold for other protocols
  return payloadSize > 10 * 1024 * 1024;
};
