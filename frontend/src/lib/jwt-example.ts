/**
 * Example of JWT token content and usage
 */

// JWT Header (automatically added by backend)
/*
const jwtHeader = {
  "alg": "HS256",  // Hashing algorithm
  "typ": "JWT"     // Token type
}
*/

// JWT Payload (our TokenPayload interface matches this)
/*  
const jwtPayload = {
  "sub": "user-uuid-here",           // Subject (User ID)
  "email": "user@example.com",       // User email
  "iat": 1722960000,                 // Issued at timestamp
  "exp": 1722963600,                 // Expires at timestamp (1 hour later)
  "iss": "veridian-api",            // Issuer (your app)
  "aud": "veridian-frontend"         // Audience (your frontend)
}
*/

// Complete JWT Token Structure:
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MjI5NjAwMDAsImV4cCI6MTcyMjk2MzYwMH0.signature
//          HEADER                           PAYLOAD                                                                                   SIGNATURE

// Frontend Usage Example:
import { decodeJWT, isTokenExpired, getTokenExpirationTime } from '@/lib/jwt-utils';

const token = localStorage.getItem('auth_token');

if (token) {
  const payload = decodeJWT(token);
  console.log('User ID:', payload?.sub);
  console.log('Email:', payload?.email);
  console.log('Expires in:', getTokenExpirationTime(token), 'seconds');
  console.log('Is expired:', isTokenExpired(token));
}

export {};
