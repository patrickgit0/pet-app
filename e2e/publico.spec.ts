import { expect, test } from '@playwright/test';

test.describe('Visitante (sem login)', () => {
  test('busca mostra animais e abre um anúncio', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('para adoção perto de você');
    const card = page.locator('#resultados a').first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/animais\/[a-z0-9-]+-[0-9a-f]{6}$/);
    await expect(page.getByRole('button', { name: 'Quero adotar' })).toBeVisible();
  });

  test('link com nome desatualizado redireciona para o link atual', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('#resultados a').first().getAttribute('href');
    const code = href!.split('-').pop();
    await page.goto(`/animais/qualquer-nome-${code}`);
    await expect(page).toHaveURL(href!);
  });

  test('páginas de SEO, feiras, lar temporário e LGPD respondem', async ({ page, request }) => {
    for (const path of ['/adotar/cachorro-em-franca', '/feiras', '/lar-temporario', '/termos', '/privacidade', '/termo-de-adocao', '/ongs', '/guia-ong']) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
    }
    expect((await request.get('/sitemap.xml')).status()).toBe(200);
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /painel');
    expect((await request.get('/manifest.webmanifest')).status()).toBe(200);
    // Página inexistente responde 404 de verdade (o loading.tsx não fica acima dessas páginas)
    for (const path of ['/adotar/nao-existe', '/animais/nao-existe-zzzzzz', '/ongs/nao-existe']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
    expect((await request.get('/api/admin/export/pedidos')).status()).toBe(403);
  });

  test('pedir adoção sem login leva para o login', async ({ page }) => {
    await page.goto('/');
    await page.locator('#resultados a').first().click();
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Quero adotar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Enviar pedido' }).click();
    await expect(page).toHaveURL(/\/entrar\?next=/);
  });
});
