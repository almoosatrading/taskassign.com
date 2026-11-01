import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clientLocalCreateUser,
  clientLocalGetUsers,
  clientLocalDeleteUser,
  clientLocalResetPassword,
  clientLocalDecideApproval,
  INITIAL_USERS,
} from './clientStore';
import { extractErrorMessage } from './client';

// Mock localStorage in Node environment for unit tests
if (typeof globalThis.localStorage === 'undefined') {
  const memStore = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => memStore.get(key) || null,
    setItem: (key: string, val: string) => memStore.set(key, String(val)),
    removeItem: (key: string) => memStore.delete(key),
    clear: () => memStore.clear(),
    key: (idx: number) => Array.from(memStore.keys())[idx] || null,
    length: 0,
  } as any;
}

test('extractErrorMessage extracts clean human-readable text and never outputs [object Object]', () => {
  // Plain string
  assert.equal(extractErrorMessage('User already exists'), 'User already exists');

  // Error instance
  assert.equal(extractErrorMessage(new Error('Invalid token')), 'Invalid token');

  // Object with message
  assert.equal(extractErrorMessage({ message: 'Network disconnected' }), 'Network disconnected');

  // Object with nested error.message
  assert.equal(extractErrorMessage({ error: { message: 'Email conflict' } }), 'Email conflict');

  // Object with error string
  assert.equal(extractErrorMessage({ error: 'Forbidden' }), 'Forbidden');

  // Object with data.message
  assert.equal(extractErrorMessage({ data: { message: 'Database timeout' } }), 'Database timeout');

  // Object with only code
  assert.equal(extractErrorMessage({ error: { code: 'UNAUTHORIZED' } }), 'UNAUTHORIZED');

  // Plain empty object or [object Object] string
  assert.ok(!extractErrorMessage('[object Object]').includes('[object Object]'));
  assert.ok(!extractErrorMessage({}).includes('[object Object]'));
});

test('clientLocalCreateUser creates a valid employee account with generated temporary password', () => {
  const result = clientLocalCreateUser({
    name: 'Faisal Al-Harbi',
    nameAr: 'فيصل الحربي',
    email: 'f.harbi@almoosa.com.sa',
    employeeId: 'EMP-0888',
    role: 'EMPLOYEE',
    jobTitle: 'Logistics Analyst',
    jobTitleAr: 'محلل لوجستي',
    department: 'Supply Chain & Logistics',
    managerId: 'usr-khalid',
  });

  assert.ok(result.user.id.startsWith('usr-'));
  assert.equal(result.user.name, 'Faisal Al-Harbi');
  assert.equal(result.user.employeeId, 'EMP-0888');
  assert.ok(result.temporaryPassword.startsWith('AlMoosa!'));
  assert.equal(result.user.mustChangePassword, true);

  // Check it appears in users list
  const users = clientLocalGetUsers();
  assert.ok(users.some((u) => u.employeeId === 'EMP-0888'));
});

test('clientLocalCreateUser rejects duplicate company email', () => {
  assert.throws(
    () => {
      clientLocalCreateUser({
        name: 'Duplicate Ahmed',
        email: 'a.mansoor@almoosa.com.sa', // already exists
        employeeId: 'EMP-9999',
        role: 'EMPLOYEE',
        jobTitle: 'Marketing',
      });
    },
    {
      message: 'An account with this company email already exists',
    }
  );
});

test('clientLocalCreateUser rejects duplicate Employee ID', () => {
  assert.throws(
    () => {
      clientLocalCreateUser({
        name: 'Duplicate Emp ID',
        email: 'new.emp@almoosa.com.sa',
        employeeId: 'EMP-0201', // already used by Ahmed Mansoor
        role: 'EMPLOYEE',
        jobTitle: 'Marketing',
      });
    },
    {
      message: 'An account with this Employee ID already exists',
    }
  );
});

test('clientLocalDeleteUser protects primary admin account from deletion', () => {
  assert.throws(
    () => {
      clientLocalDeleteUser('usr-admin-001');
    },
    {
      message: 'Primary Admin account cannot be removed',
    }
  );
});
