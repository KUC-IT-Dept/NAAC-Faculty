/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/institutional/formUtils.ts
// Minimal, dependency-free helpers for editing deeply nested form state
// (Library/MMTTC records both have several levels of nested sections)
// without hand-writing a setter for every single field. setPath always
// returns a new top-level object (never mutates in place), so it's safe to
// use directly as a React setState updater.

export function getPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function setPath<T extends Record<string, any>>(obj: T, path: string, value: any): T {
  const keys = path.split('.');
  const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };
  let cursor = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = cursor[key];
    cursor[key] = next && typeof next === 'object' ? (Array.isArray(next) ? [...next] : { ...next }) : {};
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
  return clone;
}
