import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const config = Object.fromEntries(readFileSync(new URL('../../test-manager-library-3145555-infra/.env', import.meta.url), 'utf8').split(/\r?\n/).filter(line => line.includes('=')).map(line => { const index = line.indexOf('='); return [line.slice(0, index).replace(/^\uFEFF/, ''), line.slice(index + 1)]; }));
async function login(page, username = config.ADMIN_USERNAME, password = config.ADMIN_PASSWORD) {
  await page.goto('/'); await page.getByLabel('Nombre de usuario', { exact: true }).fill(username); await page.getByLabel('Contraseña', { exact: true }).fill(password); await page.getByRole('button', { name: 'Iniciar sesión' }).click(); await expect(page.getByRole('heading', { name: 'Catálogo de libros' })).toBeVisible();
}
test('complete admin and librarian journey against the real API', async ({ page }) => {
  const failures = []; page.on('pageerror', error => failures.push(error.message));
  const suffix = Date.now().toString().slice(-9); const title = 'E2E Biblioteca ' + suffix; const member = 'Lector de prueba ' + suffix; const username = 'e2e' + suffix; const password = randomBytes(18).toString('hex');
  await login(page);
  await expect(page.locator('.book-card').first()).toBeVisible();
  mkdirSync('evidence/screenshots', { recursive: true }); await page.screenshot({ path: 'evidence/screenshots/catalog-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Registrar libro', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Título', { exact: true }).fill(title); await dialog.getByLabel('Autor', { exact: true }).fill('Autora de prueba'); await dialog.getByLabel('ISBN', { exact: true }).fill('7777' + suffix); await dialog.getByLabel('Categoría', { exact: true }).selectOption({ label: 'Novela' }); await dialog.getByLabel('Ejemplares totales').fill('2'); await dialog.getByRole('button', { name: 'Guardar libro' }).click(); await expect(dialog).not.toBeVisible();
  await page.getByLabel('Buscar libros').fill(title); await page.getByRole('button', { name: 'Buscar', exact: true }).click(); await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: title, exact: true }).click();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6X8AAAAASUVORK5CYII=', 'base64');
  await page.getByLabel('Archivo de portada').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: png }); await expect(dialog.getByRole('button', { name: 'Quitar portada' })).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'Portada de ' + title })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cerrar ventana' }).click();
  await page.getByRole('button', { name: 'Socios', exact: true }).click(); await page.getByRole('button', { name: 'Registrar socio' }).click(); await dialog.getByLabel('Nombre completo').fill(member); await dialog.getByLabel('Número de documento').fill('E2E-' + suffix); await dialog.getByRole('button', { name: 'Guardar socio' }).click(); await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Bibliotecarios', exact: true }).click(); await page.getByLabel('Nombre de usuario', { exact: true }).fill(username); await page.getByLabel('Contraseña', { exact: true }).fill(password); await page.getByRole('button', { name: 'Crear bibliotecario' }).click(); await expect(page.getByRole('status')).toContainText('fue creada');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click(); await login(page, username, password);
  await expect(page.getByRole('button', { name: 'Registrar libro', exact: true })).toHaveCount(0); await expect(page.getByRole('button', { name: 'Reportes', exact: true })).toHaveCount(0); await expect(page.getByRole('button', { name: 'Bibliotecarios', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Préstamos', exact: true }).click(); await page.getByRole('button', { name: 'Nuevo préstamo' }).click(); await dialog.getByLabel('Buscar socio', { exact: true }).fill(member); await dialog.getByRole('button', { name: new RegExp(member) }).click(); await dialog.getByLabel('Buscar libros', { exact: true }).fill(title); await dialog.getByRole('button', { name: new RegExp(title) }).click(); await dialog.getByRole('button', { name: 'Confirmar préstamo' }).click(); await expect(dialog.getByRole('heading', { name: 'Detalle del préstamo' })).toBeVisible(); await expect(dialog.getByText('Abierto', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'evidence/screenshots/loan-desktop.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Devolver', exact: true }).click(); await expect(dialog.getByText('Cerrado', { exact: true })).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Devolver', exact: true })).toHaveCount(0); await dialog.getByRole('button', { name: 'Cerrar ventana' }).click();
  await page.getByRole('button', { name: /^Vencidos/ }).click(); await expect(page.getByRole('heading', { name: 'Libros vencidos' })).toBeVisible(); await expect(page.locator('tbody tr')).toHaveCount(3);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click(); await login(page);
  await page.getByRole('button', { name: 'Reportes', exact: true }).click(); await expect(page.locator('tbody tr').first()).toBeVisible(); await page.screenshot({ path: 'evidence/screenshots/report-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Catálogo', exact: true }).click(); await page.getByLabel('Buscar libros').fill(title); await page.getByRole('button', { name: 'Buscar', exact: true }).click(); await page.getByRole('button', { name: title, exact: true }).click(); await dialog.getByRole('button', { name: 'Editar libro' }).click(); await dialog.getByLabel('Título', { exact: true }).fill(title + ' editado'); await dialog.getByRole('button', { name: 'Guardar libro' }).click(); await expect(dialog).not.toBeVisible(); await page.getByRole('button', { name: title + ' editado', exact: true }).click(); await dialog.getByRole('button', { name: 'Quitar portada' }).click(); await expect(dialog.getByRole('button', { name: 'Quitar portada' })).toHaveCount(0); await dialog.getByRole('button', { name: 'Dar de baja', exact: true }).click(); await dialog.getByRole('button', { name: 'Confirmar baja' }).click(); await expect(dialog).not.toBeVisible(); await expect(page.getByRole('button', { name: title + ' editado', exact: true })).toHaveCount(0);
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })); expect(storage).toEqual({ local: [], session: [] });
  expect(failures).toEqual([]);
});
test('mobile layout and login remain usable without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.screenshot({ path: 'evidence/screenshots/login-mobile.png', fullPage: true });
  await login(page); await expect(page.locator('.book-card').first()).toBeVisible();
  await page.screenshot({ path: 'evidence/screenshots/catalog-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Socios', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Socios', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
