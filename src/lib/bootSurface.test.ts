import { describe, expect, it } from 'vitest';
import { isApplicationEnvironmentPath } from '../lib/bootSurface';

describe('isApplicationEnvironmentPath', () => {
  it('treats public and auth surfaces as outside the application environment', () => {
    for (const path of ['/', '/login', '/school/login', '/register', '/welcome', '/welcome/login', '/results', '/reset-password', '/verify-email', '/join', '/not-found']) {
      expect(isApplicationEnvironmentPath(path)).toBe(false);
    }
  });

  it('treats authenticated workspace routes as the application environment', () => {
    for (const path of ['/session', '/school', '/school/people/students', '/personal', '/personal/home', '/platform', '/platform/overview', '/relate']) {
      expect(isApplicationEnvironmentPath(path)).toBe(true);
    }
  });
});
