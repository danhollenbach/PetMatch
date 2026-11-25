import { validateEnvironment } from './environment.js';

const credentials = {
  POSTGRES_DB: 'petmatch_test',
  POSTGRES_USER: 'test_user',
  POSTGRES_PASSWORD: 'test_password',
};

describe('Configuração do ambiente', () => {
  it('define host local e converte as portas para números', () => {
    expect(
      validateEnvironment({ ...credentials, POSTGRES_PORT: '5433' }),
    ).toMatchObject({
      POSTGRES_HOST: '127.0.0.1',
      POSTGRES_PORT: 5433,
      PORT: 3000,
    });
  });

  it.each(['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'])(
    'rejeita %s ausente sem expor credenciais',
    (key) => {
      expect(() =>
        validateEnvironment({ ...credentials, [key]: undefined }),
      ).toThrow(`Defina ${key} no .env da raiz do projeto.`);
    },
  );

  it.each(['', 'abc', '5432.5', '0', '65536'])(
    'rejeita porta inválida: %s',
    (value) => {
      expect(() =>
        validateEnvironment({ ...credentials, POSTGRES_PORT: value }),
      ).toThrow('POSTGRES_PORT deve ser uma porta inteira entre 1 e 65535.');
    },
  );
});
