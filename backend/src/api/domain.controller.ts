import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { DomainService } from './domain.service.js';

@Controller('api')
export class DomainController {
  constructor(private readonly domain: DomainService) {}
  @Get('dados') snapshot() { return this.domain.snapshot(); }
  @Post('pedidos-adocao/:id/decisao') decide(@Param('id') id: string, @Body() body: unknown) { return this.domain.decide(id, body); }
  @Put('abrigos/:cnpj/equipe/:kind') team(@Param('cnpj') cnpj: string, @Param('kind') kind: string, @Body() body: unknown) {
    return this.domain.team(cnpj, kind, body);
  }
  @Delete('abrigos/:cnpj/equipe/:kind/:cpf') unlink(@Param('cnpj') cnpj: string, @Param('kind') kind: string, @Param('cpf') cpf: string) {
    return this.domain.team(cnpj, kind, undefined, cpf);
  }
  @Post('prontuarios/:id/aplicacoes') apply(@Param('id') id: string, @Body() body: unknown) { return this.domain.applications(id, body); }
  @Put('prontuarios/:id/aplicacoes/:vacina/:dose') editApplication(@Param('id') id: string, @Param('vacina') vaccine: string, @Param('dose') dose: string, @Body() body: unknown) {
    return this.domain.applications(id, body, vaccine, dose);
  }
  @Delete('prontuarios/:id/aplicacoes/:vacina/:dose') removeApplication(@Param('id') id: string, @Param('vacina') vaccine: string, @Param('dose') dose: string) {
    return this.domain.applications(id, undefined, vaccine, dose, true);
  }
  @Get('abrigos/:cnpj/equipe/:kind') members(@Param('cnpj') cnpj: string, @Param('kind') kind: string) { return this.domain.members(cnpj, kind); }
  @Get('feiras/:id/participantes') participants(@Param('id') id: string) { return this.domain.participation(id); }
  @Put('feiras/:id/participantes') replaceParticipants(@Param('id') id: string, @Body() body: unknown) { return this.domain.participation(id, body); }
  @Get('prontuarios/:id/aplicacoes') applications(@Param('id') id: string) { return this.domain.listApplications(id); }
  @Get(':resource') list(@Param('resource') resource: string) { return this.domain.list(resource); }
  @Get(':resource/:id') get(@Param('resource') resource: string, @Param('id') id: string) { return this.domain.get(resource, id); }
  @Post(':resource') create(@Param('resource') resource: string, @Body() body: unknown) { return this.domain.create(resource, body); }
  @Put(':resource/:id') update(@Param('resource') resource: string, @Param('id') id: string, @Body() body: unknown) { return this.domain.update(resource, id, body); }
  @Delete(':resource/:id') remove(@Param('resource') resource: string, @Param('id') id: string) { return this.domain.remove(resource, id); }
}
