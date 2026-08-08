/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-var */

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegisteredSW?: (
      swScriptUrl: string,
      registration: ServiceWorkerRegistration | undefined
    ) => void;
    onRegisterError?: (error: unknown) => void;
  }
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

declare module 'astro:content' {
  export function getCollection(collection: string): Promise<any[]>;
  export function getEntryBySlug(...args: any[]): Promise<any>;
  export function defineCollection(config?: any): any;
  export const z: any;
  export type CollectionEntry<C extends string> = any;
  export type ContentCollectionConfig = any;
  export type CollectionConfig = any;
  export type DataCollectionConfig = any;
  export type DataEntry = any;
  export type DataEntryMap = any;
}

declare module 'astro:middleware' {
  import type { APIContext, MiddlewareNext } from 'astro';
  export type MiddlewareHandler = (
    context: APIContext,
    next: MiddlewareNext,
  ) => Promise<Response> | Response;
  export function defineMiddleware(
    fn: MiddlewareHandler,
  ): MiddlewareHandler;
  export function sequence(
    ...handlers: MiddlewareHandler[]
  ): MiddlewareHandler;
}

declare module 'astro/loaders' {
  export function glob(opts: { pattern: string | string[]; base?: string }): any;
  export function file(path: string, opts?: any): any;
}

declare module '*.css' {
  const stylesheet: unknown;
  export default stylesheet;
}

interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
