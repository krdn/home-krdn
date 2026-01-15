/**
 * RBAC (Role-Based Access Control) 단위 테스트
 *
 * Phase 25: Test Coverage Expansion
 * - hasPermission 함수 테스트
 * - getAllowedActions 함수 테스트
 * - getResourceFromPath 함수 테스트
 * - getActionFromMethod 함수 테스트
 * - canAccessRoute 함수 테스트
 * - findMinimumRequiredRole 함수 테스트
 * - isRoleAtLeast 함수 테스트
 * - ROLE_PERMISSIONS 상수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  getAllowedActions,
  getResourceFromPath,
  getActionFromMethod,
  canAccessRoute,
  findMinimumRequiredRole,
  isRoleAtLeast,
  ROLE_PERMISSIONS,
} from './rbac';
import type { UserRole, Resource, Action } from '@/types/auth';

describe('rbac', () => {
  // ============================================================
  // ROLE_PERMISSIONS 상수 테스트
  // ============================================================
  describe('ROLE_PERMISSIONS', () => {
    it('should have admin role with all resources', () => {
      expect(ROLE_PERMISSIONS.admin).toBeDefined();
      expect(ROLE_PERMISSIONS.admin.length).toBe(5);

      const resources = ROLE_PERMISSIONS.admin.map(p => p.resource);
      expect(resources).toContain('system');
      expect(resources).toContain('docker');
      expect(resources).toContain('projects');
      expect(resources).toContain('users');
      expect(resources).toContain('admin');
    });

    it('should have user role with limited resources', () => {
      expect(ROLE_PERMISSIONS.user).toBeDefined();
      expect(ROLE_PERMISSIONS.user.length).toBe(3);

      const resources = ROLE_PERMISSIONS.user.map(p => p.resource);
      expect(resources).toContain('system');
      expect(resources).toContain('docker');
      expect(resources).toContain('projects');
      expect(resources).not.toContain('users');
      expect(resources).not.toContain('admin');
    });

    it('should have viewer role with read-only permissions', () => {
      expect(ROLE_PERMISSIONS.viewer).toBeDefined();
      expect(ROLE_PERMISSIONS.viewer.length).toBe(3);

      // viewer는 모든 리소스에 read만 가능
      for (const permission of ROLE_PERMISSIONS.viewer) {
        expect(permission.actions).toEqual(['read']);
      }
    });

    it('should have admin with all actions on all resources', () => {
      for (const permission of ROLE_PERMISSIONS.admin) {
        expect(permission.actions).toContain('read');
        expect(permission.actions).toContain('write');
        expect(permission.actions).toContain('delete');
        expect(permission.actions).toContain('manage');
      }
    });
  });

  // ============================================================
  // hasPermission 함수 테스트
  // ============================================================
  describe('hasPermission', () => {
    describe('admin role', () => {
      it('should allow admin to read system', () => {
        expect(hasPermission('admin', 'system', 'read')).toBe(true);
      });

      it('should allow admin to write docker', () => {
        expect(hasPermission('admin', 'docker', 'write')).toBe(true);
      });

      it('should allow admin to delete projects', () => {
        expect(hasPermission('admin', 'projects', 'delete')).toBe(true);
      });

      it('should allow admin to manage users', () => {
        expect(hasPermission('admin', 'users', 'manage')).toBe(true);
      });

      it('should allow admin to access admin resource', () => {
        expect(hasPermission('admin', 'admin', 'read')).toBe(true);
        expect(hasPermission('admin', 'admin', 'manage')).toBe(true);
      });
    });

    describe('user role', () => {
      it('should allow user to read system', () => {
        expect(hasPermission('user', 'system', 'read')).toBe(true);
      });

      it('should not allow user to write system', () => {
        expect(hasPermission('user', 'system', 'write')).toBe(false);
      });

      it('should allow user to read and write docker', () => {
        expect(hasPermission('user', 'docker', 'read')).toBe(true);
        expect(hasPermission('user', 'docker', 'write')).toBe(true);
      });

      it('should not allow user to delete docker', () => {
        expect(hasPermission('user', 'docker', 'delete')).toBe(false);
      });

      it('should not allow user to access users resource', () => {
        expect(hasPermission('user', 'users', 'read')).toBe(false);
        expect(hasPermission('user', 'users', 'write')).toBe(false);
      });

      it('should not allow user to access admin resource', () => {
        expect(hasPermission('user', 'admin', 'read')).toBe(false);
      });
    });

    describe('viewer role', () => {
      it('should allow viewer to read system', () => {
        expect(hasPermission('viewer', 'system', 'read')).toBe(true);
      });

      it('should not allow viewer to write anything', () => {
        expect(hasPermission('viewer', 'system', 'write')).toBe(false);
        expect(hasPermission('viewer', 'docker', 'write')).toBe(false);
        expect(hasPermission('viewer', 'projects', 'write')).toBe(false);
      });

      it('should not allow viewer to delete anything', () => {
        expect(hasPermission('viewer', 'docker', 'delete')).toBe(false);
      });
    });

    describe('invalid roles', () => {
      it('should return false for unknown role', () => {
        expect(hasPermission('unknown' as UserRole, 'system', 'read')).toBe(false);
      });

      it('should return false for empty string role', () => {
        expect(hasPermission('' as UserRole, 'system', 'read')).toBe(false);
      });
    });
  });

  // ============================================================
  // getAllowedActions 함수 테스트
  // ============================================================
  describe('getAllowedActions', () => {
    it('should return all actions for admin on any resource', () => {
      const actions = getAllowedActions('admin', 'docker');
      expect(actions).toContain('read');
      expect(actions).toContain('write');
      expect(actions).toContain('delete');
      expect(actions).toContain('manage');
    });

    it('should return read and write for user on docker', () => {
      const actions = getAllowedActions('user', 'docker');
      expect(actions).toEqual(['read', 'write']);
    });

    it('should return only read for user on system', () => {
      const actions = getAllowedActions('user', 'system');
      expect(actions).toEqual(['read']);
    });

    it('should return only read for viewer on any allowed resource', () => {
      expect(getAllowedActions('viewer', 'system')).toEqual(['read']);
      expect(getAllowedActions('viewer', 'docker')).toEqual(['read']);
      expect(getAllowedActions('viewer', 'projects')).toEqual(['read']);
    });

    it('should return empty array for user on users resource', () => {
      const actions = getAllowedActions('user', 'users');
      expect(actions).toEqual([]);
    });

    it('should return empty array for unknown role', () => {
      const actions = getAllowedActions('unknown' as UserRole, 'system');
      expect(actions).toEqual([]);
    });

    it('should return empty array for unknown resource', () => {
      const actions = getAllowedActions('admin', 'unknown' as Resource);
      expect(actions).toEqual([]);
    });
  });

  // ============================================================
  // getResourceFromPath 함수 테스트
  // ============================================================
  describe('getResourceFromPath', () => {
    it('should extract admin resource from admin paths', () => {
      expect(getResourceFromPath('/api/admin/users')).toBe('admin');
      expect(getResourceFromPath('/admin/settings')).toBe('admin');
    });

    it('should extract system resource from system paths', () => {
      expect(getResourceFromPath('/api/system/info')).toBe('system');
      expect(getResourceFromPath('/api/system/status')).toBe('system');
    });

    it('should extract docker resource from docker paths', () => {
      expect(getResourceFromPath('/api/docker/containers')).toBe('docker');
      expect(getResourceFromPath('/api/docker/images/list')).toBe('docker');
    });

    it('should extract projects resource from projects paths', () => {
      expect(getResourceFromPath('/api/projects/1')).toBe('projects');
      expect(getResourceFromPath('/api/projects/create')).toBe('projects');
    });

    it('should extract users resource from users paths', () => {
      expect(getResourceFromPath('/api/users/profile')).toBe('users');
      expect(getResourceFromPath('/api/users/1')).toBe('users');
    });

    it('should return null for unknown paths', () => {
      expect(getResourceFromPath('/api/unknown')).toBeNull();
      expect(getResourceFromPath('/random/path')).toBeNull();
      expect(getResourceFromPath('/')).toBeNull();
    });

    it('should handle paths with query strings', () => {
      expect(getResourceFromPath('/api/docker/containers?status=running')).toBe('docker');
    });
  });

  // ============================================================
  // getActionFromMethod 함수 테스트
  // ============================================================
  describe('getActionFromMethod', () => {
    it('should return read for GET method', () => {
      expect(getActionFromMethod('GET')).toBe('read');
    });

    it('should return read for HEAD method', () => {
      expect(getActionFromMethod('HEAD')).toBe('read');
    });

    it('should return read for OPTIONS method', () => {
      expect(getActionFromMethod('OPTIONS')).toBe('read');
    });

    it('should return write for POST method', () => {
      expect(getActionFromMethod('POST')).toBe('write');
    });

    it('should return write for PUT method', () => {
      expect(getActionFromMethod('PUT')).toBe('write');
    });

    it('should return write for PATCH method', () => {
      expect(getActionFromMethod('PATCH')).toBe('write');
    });

    it('should return delete for DELETE method', () => {
      expect(getActionFromMethod('DELETE')).toBe('delete');
    });

    it('should handle lowercase methods', () => {
      expect(getActionFromMethod('get')).toBe('read');
      expect(getActionFromMethod('post')).toBe('write');
      expect(getActionFromMethod('delete')).toBe('delete');
    });

    it('should return read for unknown methods', () => {
      expect(getActionFromMethod('UNKNOWN')).toBe('read');
      expect(getActionFromMethod('')).toBe('read');
    });
  });

  // ============================================================
  // canAccessRoute 함수 테스트
  // ============================================================
  describe('canAccessRoute', () => {
    it('should allow admin to access any route', () => {
      const result = canAccessRoute('admin', '/api/admin/users', 'GET');
      expect(result.allowed).toBe(true);
      expect(result.resource).toBe('admin');
      expect(result.action).toBe('read');
    });

    it('should allow viewer to read docker', () => {
      const result = canAccessRoute('viewer', '/api/docker/containers', 'GET');
      expect(result.allowed).toBe(true);
      expect(result.resource).toBe('docker');
      expect(result.action).toBe('read');
    });

    it('should deny viewer to write docker', () => {
      const result = canAccessRoute('viewer', '/api/docker/containers', 'POST');
      expect(result.allowed).toBe(false);
      expect(result.resource).toBe('docker');
      expect(result.action).toBe('write');
      expect(result.requiredRole).toBe('user');
    });

    it('should allow user to write projects', () => {
      const result = canAccessRoute('user', '/api/projects/1', 'PUT');
      expect(result.allowed).toBe(true);
      expect(result.resource).toBe('projects');
      expect(result.action).toBe('write');
    });

    it('should deny user to access admin routes', () => {
      const result = canAccessRoute('user', '/api/admin/settings', 'GET');
      expect(result.allowed).toBe(false);
      expect(result.resource).toBe('admin');
      expect(result.requiredRole).toBe('admin');
    });

    it('should allow access to unprotected routes', () => {
      const result = canAccessRoute('viewer', '/api/public/health', 'GET');
      expect(result.allowed).toBe(true);
      expect(result.resource).toBeNull();
    });

    it('should use GET as default method', () => {
      const result = canAccessRoute('viewer', '/api/docker/containers');
      expect(result.action).toBe('read');
      expect(result.allowed).toBe(true);
    });
  });

  // ============================================================
  // findMinimumRequiredRole 함수 테스트
  // ============================================================
  describe('findMinimumRequiredRole', () => {
    it('should return viewer for read on system', () => {
      expect(findMinimumRequiredRole('system', 'read')).toBe('viewer');
    });

    it('should return admin for write on system', () => {
      expect(findMinimumRequiredRole('system', 'write')).toBe('admin');
    });

    it('should return user for write on docker', () => {
      expect(findMinimumRequiredRole('docker', 'write')).toBe('user');
    });

    it('should return admin for delete on docker', () => {
      expect(findMinimumRequiredRole('docker', 'delete')).toBe('admin');
    });

    it('should return admin for manage on any resource', () => {
      expect(findMinimumRequiredRole('docker', 'manage')).toBe('admin');
      expect(findMinimumRequiredRole('projects', 'manage')).toBe('admin');
    });

    it('should return admin for users resource', () => {
      expect(findMinimumRequiredRole('users', 'read')).toBe('admin');
      expect(findMinimumRequiredRole('users', 'write')).toBe('admin');
    });

    it('should return admin for admin resource', () => {
      expect(findMinimumRequiredRole('admin', 'read')).toBe('admin');
    });
  });

  // ============================================================
  // isRoleAtLeast 함수 테스트
  // ============================================================
  describe('isRoleAtLeast', () => {
    it('should return true for admin compared to any role', () => {
      expect(isRoleAtLeast('admin', 'viewer')).toBe(true);
      expect(isRoleAtLeast('admin', 'user')).toBe(true);
      expect(isRoleAtLeast('admin', 'admin')).toBe(true);
    });

    it('should return true for user compared to viewer or user', () => {
      expect(isRoleAtLeast('user', 'viewer')).toBe(true);
      expect(isRoleAtLeast('user', 'user')).toBe(true);
    });

    it('should return false for user compared to admin', () => {
      expect(isRoleAtLeast('user', 'admin')).toBe(false);
    });

    it('should return true for viewer compared to viewer only', () => {
      expect(isRoleAtLeast('viewer', 'viewer')).toBe(true);
    });

    it('should return false for viewer compared to higher roles', () => {
      expect(isRoleAtLeast('viewer', 'user')).toBe(false);
      expect(isRoleAtLeast('viewer', 'admin')).toBe(false);
    });
  });
});
