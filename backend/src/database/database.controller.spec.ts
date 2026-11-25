import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DatabaseController } from './database.controller.js';
import { DatabaseService } from './database.service.js';

describe('Diagnóstico do PostgreSQL', () => {
  it('retorna indisponível sem expor o erro interno de conexão', async () => {
    const module = await Test.createTestingModule({
      controllers: [DatabaseController],
      providers: [
        {
          provide: DatabaseService,
          useValue: {
            query: vi.fn().mockRejectedValue(new Error('detalhes internos')),
          },
        },
      ],
    }).compile();

    try {
      await expect(
        module.get(DatabaseController).check(),
      ).rejects.toMatchObject({
        response: { status: 'error', database: 'down' },
      });
      await expect(
        module.get(DatabaseController).check(),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    } finally {
      await module.close();
    }
  });
});
