import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to log CORS-related information for debugging
 */
export const corsDebug = (req: Request, res: Response, next: NextFunction) => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔍 CORS Debug:');
    console.log('Method:', req.method);
    console.log('Origin:', req.headers.origin || 'No origin header');
    console.log('Referer:', req.headers.referer || 'No referer');
    console.log('Host:', req.headers.host);
    console.log('URL:', req.url);
    
    // Log CORS specific headers
    console.log('Request Headers:', {
      'access-control-request-method': req.headers['access-control-request-method'],
      'access-control-request-headers': req.headers['access-control-request-headers']
    });
    
    // Add response headers for debugging
    res.on('finish', () => {
      console.log('Response Headers:', {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
        'Vary': res.getHeader('Vary')
      });
      console.log('Status:', res.statusCode);
    });
  }
  
  next();
};

/**
 * Test endpoint for CORS debugging
 */
export const corsTestEndpoint = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'CORS test endpoint',
    cors: {
      origin: req.headers.origin,
      allowed: process.env.FRONTEND_ORIGIN?.split(',') || [],
      timestamp: new Date().toISOString()
    }
  });
};