// These module declarations are overriding the actual types from the libraries,
// causing numerous "Untyped function call" and "Cannot use namespace as type" errors.
// Commenting them out allows TypeScript to load the correct types from node_modules.
/*
declare module 'react-router-dom';
declare module 'lucide-react';
declare module 'react-hook-form';
declare module '@hookform/resolvers/yup';
declare module 'yup';
declare module 'date-fns';
declare module '@google/genai';
declare module 'react-date-range';
declare module 'zustand';
declare module 'zustand/middleware';
declare module 'vite';
declare module '@vitejs/plugin-react';
*/
