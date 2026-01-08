import { CorsOptions } from 'cors';
import { ServerOptions } from 'socket.io';

/**
 * Dynamic CORS configuration that handles multiple origins and subdomains
 */
export const getCorsOptions = (): CorsOptions => {
  const allowedOrigins = process.env.FRONTEND_ORIGIN?.split(',') || [];
  
  // Add www subdomain automatically for each origin
  const enhancedOrigins = allowedOrigins.reduce((acc, origin) => {
    acc.push(origin);
    
    // If it's an https://domain without www, add www version
    if (origin.startsWith('https://') && !origin.includes('www.')) {
      const domain = origin.replace('https://', '');
      acc.push(`https://www.${domain}`);
    }
    
    // If it's an https://www.domain, add non-www version
    if (origin.startsWith('https://www.')) {
      acc.push(origin.replace('https://www.', 'https://'));
    }
    
    return acc;
  }, [] as string[]);

  // Add localhost for development
  if (process.env.NODE_ENV === 'development') {
    enhancedOrigins.push('http://localhost:3000');
    enhancedOrigins.push('http://127.0.0.1:3000');
  }

  const uniqueOrigins = [...new Set(enhancedOrigins)];
  
  console.log('🌐 Configured CORS origins:', uniqueOrigins);

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is allowed
      if (uniqueOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow subdomains of main domains
      const isSubdomainAllowed = uniqueOrigins.some(allowedOrigin => {
        try {
          const allowedUrl = new URL(allowedOrigin);
          const requestUrl = new URL(origin);
          
          // Check if same protocol and root domain
          const allowedDomain = allowedUrl.hostname.replace('www.', '');
          const requestDomain = requestUrl.hostname.replace('www.', '');
          
          return allowedUrl.protocol === requestUrl.protocol && 
                 requestDomain.endsWith(allowedDomain);
        } catch {
          return false;
        }
      });
      
      if (isSubdomainAllowed) {
        return callback(null, true);
      }
      
      console.warn('❌ CORS blocked:', origin, 'Allowed:', uniqueOrigins);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-API-Key'
    ],
    exposedHeaders: [
      'Content-Range',
      'X-Content-Range',
      'Access-Control-Allow-Origin'
    ]
  };
};

/**
 * Socket.IO CORS configuration
 */
// export const getSocketCorsConfig = () => ({
//   origin: getCorsOptions().origin,
//   credentials: true,
//   methods: ['GET', 'POST'],
//   transports: ['websocket', 'polling'] as const,
//   allowedHeaders: ['Authorization', 'Content-Type'],
// });

export const getSocketCorsConfig = (): Partial<ServerOptions> => ({
  cors: {
    origin: getCorsOptions().origin,
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  transports: ['websocket', 'polling'],
});