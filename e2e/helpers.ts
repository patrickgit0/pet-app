import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'adotai123'; // usuários fictícios do supabase/seed.sql
export const USERS = {
  adotante: 'adotante@adotai.dev',
  novo: 'novo@adotai.dev',
  ong: 'ong1@adotai.dev',
  admin: 'admin@adotai.dev',
};

export async function login(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto('/entrar');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/entrar'));
  // aviso de cookies não deve cobrir botões
  await page.context().addCookies([{ name: 'aviso_cookies', value: '1', url: page.url() }]);
}

/** Clica num botão que abre a janela "Cancelar / Confirmar" e confirma. */
export async function confirmAction(page: Page, button: string, confirmLabel: string) {
  await page.getByRole('button', { name: button, exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: confirmLabel, exact: true }).click();
}
