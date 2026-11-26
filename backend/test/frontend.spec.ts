import { afterEach, describe, expect, it, vi } from 'vitest';
import { request, ApiError } from '../../frontend/src/lib/api';
import { createApiActions } from '../../frontend/src/store/actions';
import { animal, record } from './business.fixture.js';

afterEach(() => vi.unstubAllGlobals());
describe('cliente HTTP do frontend', () => {
  it('preserva código e queries de SQL pendente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'SQL_NOT_IMPLEMENTED', queries: ['animal.insert'] }), { status: 501 })));
    await expect(request('/animais')).rejects.toMatchObject({ status: 501, code: 'SQL_NOT_IMPLEMENTED', queries: ['animal.insert'] });
  });
  it('mostra falha de rede sem fallback para dados fictícios', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(request('/dados')).rejects.toBeInstanceOf(ApiError);
  });
  it('não recarrega nem resolve como sucesso quando escrita falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Lotado' }), { status: 409 })));
    const reload = vi.fn();
    await expect(createApiActions(reload).removerFeira(1)).rejects.toMatchObject({ message: 'Lotado' });
    expect(reload).not.toHaveBeenCalled();
  });
  it('aguarda gravação e recarga, usa id retornado e não envia id no corpo', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...animal, id: 7 })));
    vi.stubGlobal('fetch', fetch);
    let done!: () => void;
    const reload = vi.fn(() => new Promise<void>(resolve => { done = resolve; }));
    const { id: _id, ...data } = animal;
    const { id: _r, id_animal: _a, ...prontuario } = record;
    let settled = false;
    const result = createApiActions(reload).salvarAnimal(data, prontuario).then(value => { settled = true; return value; });
    await vi.waitFor(() => expect(reload).toHaveBeenCalled());
    expect(settled).toBe(false);
    expect(fetch.mock.calls[0][0]).toBe('/api/animais');
    expect(JSON.parse(fetch.mock.calls[0][1].body).animal).not.toHaveProperty('id');
    done(); await expect(result).resolves.toBe(7);
  });
});
