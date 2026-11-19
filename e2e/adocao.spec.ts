import { expect, test } from '@playwright/test';
import { USERS, confirmAction, login } from './helpers';

/**
 * Ciclo completo: ONG publica (duplicando um animal) → adotante pede (com compromisso) →
 * ONG aprova e confirma a adoção → adotante aceita o termo e baixa a cópia.
 */
test.describe.serial('Ciclo de adoção', () => {
  const name = `E2E ${Date.now().toString(36)}`;
  let animalUrl = '';

  test('ONG duplica um animal e publica', async ({ page }) => {
    await login(page, USERS.ong);
    await page.goto('/painel/animais');
    await page.locator('a[href^="/painel/animais/"]:not([href$="/novo"])').first().click();
    await confirmAction(page, 'Duplicar', 'Duplicar');
    await expect(page).toHaveURL(/duplicado=1/);
    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="publish"]').check();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.waitForURL('**/painel/animais');
    await expect(page.getByText(name)).toBeVisible();
  });

  test('adotante pede a adoção com o compromisso', async ({ page }) => {
    await login(page, USERS.adotante);
    await page.goto(`/?q=${encodeURIComponent(name)}&raio=50`);
    await page.locator('#resultados a').filter({ hasText: name }).click();
    animalUrl = page.url();
    await page.locator('input[name="compromisso"]').check();
    await confirmAction(page, 'Quero adotar', 'Enviar pedido');
    await expect(page).toHaveURL(/\/mensagens\/.+pedido=enviado/);
    await expect(page.getByText('Pedido enviado!')).toBeVisible();
  });

  test('ONG vê o pedido esperando resposta, aprova e confirma a adoção', async ({ page }) => {
    await login(page, USERS.ong);
    await page.goto('/painel/pedidos?aba=esperando');
    const row = page.locator('tr').filter({ hasText: name });
    await expect(row).toBeVisible();
    await row.getByRole('link', { name: 'Ver perfil' }).click();
    await expect(page.getByText('Aceitou o compromisso de guarda responsável')).toBeVisible();
    await confirmAction(page, 'Aprovar pedido', 'Aprovar pedido');
    await confirmAction(page, 'Confirmar adoção (animal entregue)', 'Confirmar adoção');
    await expect(page).toHaveURL(/\/painel\/pos-adocao\?nova=1/);
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test('adotante aceita o termo e abre a cópia', async ({ page }) => {
    await login(page, USERS.adotante);
    await page.goto('/meus-pedidos');
    const card = page.locator('article').filter({ hasText: name });
    await card.getByRole('button', { name: 'Li e aceito' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Li e aceito' }).click();
    await expect(card.getByText(/Termo aceito em/)).toBeVisible();
    await card.getByRole('link', { name: 'Baixar cópia (PDF)' }).click();
    await expect(page.getByRole('heading', { name: 'Termo de adoção responsável' })).toBeVisible();
    // o anúncio adotado sai da vitrine
    const res = await page.goto(animalUrl);
    expect(res?.status()).not.toBe(500);
  });
});

test('adotante com perfil incompleto vai completar o perfil antes do pedido', async ({ page }) => {
  await login(page, USERS.novo);
  await page.goto('/');
  await page.locator('#resultados a').first().click();
  await page.locator('input[name="compromisso"]').check();
  await confirmAction(page, 'Quero adotar', 'Enviar pedido');
  await expect(page).toHaveURL(/\/perfil\/editar\?animal=/);
});

test('admin exporta CSV', async ({ page }) => {
  await login(page, USERS.admin);
  const res = await page.request.get('/api/admin/export/adocoes');
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('adotado_em;status');
});
