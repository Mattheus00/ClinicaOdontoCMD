/// <reference types="vite/client" />

import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGlobalError?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    skipGlobalError?: boolean;
  }
}
