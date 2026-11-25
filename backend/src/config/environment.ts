function requiredString(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Defina ${key} no .env da raiz do projeto.`);
  }
  return value;
}

function port(value: unknown, fallback: number, key: string): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${key} deve ser uma porta inteira entre 1 e 65535.`);
  }
  return parsed;
}

export function validateEnvironment(config: Record<string, unknown>) {
  return {
    ...config,
    POSTGRES_HOST: requiredString(
      { POSTGRES_HOST: '127.0.0.1', ...config },
      'POSTGRES_HOST',
    ),
    POSTGRES_PORT: port(config.POSTGRES_PORT, 5433, 'POSTGRES_PORT'),
    POSTGRES_DB: requiredString(config, 'POSTGRES_DB'),
    POSTGRES_USER: requiredString(config, 'POSTGRES_USER'),
    POSTGRES_PASSWORD: requiredString(config, 'POSTGRES_PASSWORD'),
    PORT: port(config.PORT, 3000, 'PORT'),
  };
}
