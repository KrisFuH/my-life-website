// 全局编辑模式：密码验证通过后进入编辑模式（sessionStorage 保存）
// 密码不存放在前端，只通过后端 /api/verify-password 校验
import { useEffect, useState } from 'react';
import { verifyPassword } from './api.js';

const EDIT_KEY = 'edit_mode';
const TOKEN_KEY = 'auth_token_coming_road';
const AUTH_KEY = 'auth_coming_road';

function readEditMode() {
  try {
    return sessionStorage.getItem(EDIT_KEY) === 'true';
  } catch {
    return false;
  }
}

let state = { editMode: readEditMode(), gateOpen: false };
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l(state));
}

export function useEditMode() {
  const [s, setS] = useState(state);
  useEffect(() => {
    const handler = (st) => setS({ ...st });
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);
  return s;
}

export function openGate() {
  state = { ...state, gateOpen: true };
  emit();
}

export function closeGate() {
  state = { ...state, gateOpen: false };
  emit();
}

// 通过后端校验密码；成功则进入编辑模式并保存 token
export async function unlock(password) {
  const r = await verifyPassword(password);
  if (r && r.success) {
    try {
      if (r.token) sessionStorage.setItem(TOKEN_KEY, r.token);
      sessionStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem(EDIT_KEY, 'true');
    } catch {
      /* ignore */
    }
    state = { editMode: true, gateOpen: false };
    emit();
    return { ok: true };
  }
  return { ok: false, error: (r && r.error) || '密码错误' };
}

export function setEditMode(value) {
  try {
    sessionStorage.setItem(EDIT_KEY, value ? 'true' : 'false');
  } catch {
    /* ignore */
  }
  state = { ...state, editMode: value };
  emit();
}

// 退出编辑模式：清除 token 与编辑标志
export function lock() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(EDIT_KEY);
  } catch {
    /* ignore */
  }
  state = { ...state, editMode: false };
  emit();
}
