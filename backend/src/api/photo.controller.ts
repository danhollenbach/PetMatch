import { BadRequestException, Controller, Delete, Get, NotFoundException, Param, Put, Res, ServiceUnavailableException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { QueryRunner, type Executor } from './query-runner.js';
import { photoQueries as q } from './photo.queries.js';
import { query } from './domain.queries.js';
import { id } from './rules.js';

export interface PhotoFile { buffer: Buffer; mimetype: string; originalname: string }
export function validatePhoto(file?: PhotoFile) {
  if (!file || !Buffer.isBuffer(file.buffer) || !file.buffer.length) throw new BadRequestException('Envie o arquivo no campo foto.');
  if (file.buffer.length > 5 * 1024 * 1024) throw new BadRequestException('Foto deve ter até 5 MB.');
  const png = file.buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = file.buffer[0] === 255 && file.buffer[1] === 216 && file.buffer[2] === 255;
  if (!(png && file.mimetype === 'image/png') && !(jpeg && file.mimetype === 'image/jpeg')) {
    throw new BadRequestException('Formato inválido: envie JPEG ou PNG com assinatura correspondente.');
  }
  return { ...file, originalname: file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0,120) || 'foto' };
}
@Controller('api/animais/:id/foto')
export class PhotoController {
  constructor(private readonly runner: QueryRunner) {}
  private operation<T>(animalId: number, operation: keyof typeof q, work: (run: Executor) => Promise<T>) {
    return this.runner.transaction([query('animal','list'), q[operation]], async run => {
      const animals = await run(query('animal','list'));
      if (!animals.rows.some(animal => animal.id === animalId)) throw new NotFoundException('Animal não encontrado.');
      return work(run);
    });
  }
  @Get()
  async get(@Param('id') value: string, @Res() response: Response) {
    const animalId = id(value);
    const result = await this.operation(animalId, 'get', run => run(q.get, [animalId]));
    const photo = result.rows[0];
    if (!photo) throw new NotFoundException('Animal sem foto.');
    if (result.rows.length !== 1 || !Buffer.isBuffer(photo.dados) || !['image/jpeg','image/png'].includes(photo.mime as string)) throw new ServiceUnavailableException('Contrato de foto inválido.');
    response.set({ 'Content-Type': photo.mime, 'Content-Length': photo.dados.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.send(photo.dados);
  }
  @Put()
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 } }))
  async put(@Param('id') value: string, @UploadedFile() input?: PhotoFile) {
    const animalId = id(value), photo = validatePhoto(input);
    await this.operation(animalId, 'save', async run => {
      const result = await run(q.save, [animalId, photo.buffer, photo.mimetype, photo.originalname]);
      if (result.rowCount !== 1 || result.rows.length !== 1) throw new ServiceUnavailableException('Contrato de gravação de foto inválido.');
    });
    return { id_animal: animalId };
  }
  @Delete()
  async remove(@Param('id') value: string) {
    const animalId = id(value);
    await this.operation(animalId, 'delete', run => run(q.delete, [animalId]));
    return { id_animal: animalId };
  }
}
