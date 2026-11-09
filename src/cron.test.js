import { describe, it, expect } from 'vitest';
import { parseCron, descreverCron, proximasExecucoes, CronInvalido } from './cron.js';

describe('descreverCron', () => {
  it.each([
    ['* * * * *', 'A cada minuto'],
    ['*/15 * * * *', 'A cada 15 minutos'],
    ['30 * * * *', 'No minuto 30 de cada hora'],
    ['0 9 * * *', 'Às 09:00, todos os dias'],
    ['30 9,18 * * *', 'Às 09:30 e 18:30, todos os dias'],
    ['*/15 9-18 * * 1-5', 'A cada 15 minutos, das 9h00 às 18h59, de segunda a sexta'],
    ['0 0 1 * *', 'Às 00:00, no dia 1 do mês'],
    ['0 8 * * 1,3,5', 'Às 08:00, às segundas, às quartas e às sextas'],
    ['0 0 1 1 *', 'Às 00:00, no dia 1 do mês, em janeiro'],
    ['0 */2 * * *', 'No minuto 0, a cada 2 horas'],
    ['5/20 * * * *', 'A cada 20 minutos a partir do minuto 5'],
    ['0 12 1 * 0', 'Às 12:00, no dia 1 do mês ou aos domingos'],
    ['@daily', 'Às 00:00, todos os dias'],
  ])('%s → %s', (expressao, esperado) => {
    expect(descreverCron(expressao)).toBe(esperado);
  });
});

describe('parseCron — erros', () => {
  it.each([
    ['* * * *', /5 campos.*recebi 4/],
    ['60 * * * *', /minuto.*60 está fora do intervalo 0–59/],
    ['0 25 * * *', /hora.*25/],
    ['0 0 0 * *', /dia do mês.*0/],
    ['0 0 * 13 *', /mês.*13/],
    ['abc * * * *', /minuto.*"abc"/],
    ['*/0 * * * *', /passo deve ser maior que zero/],
    ['0 18-9 * * *', /invertido/],
  ])('%s', (expressao, mensagem) => {
    expect(() => parseCron(expressao)).toThrow(CronInvalido);
    expect(() => parseCron(expressao)).toThrow(mensagem);
  });

  it('trata 7 como domingo', () => {
    expect([...parseCron('0 0 * * 7').diaSemana.valores]).toEqual([0]);
  });
});

describe('proximasExecucoes', () => {
  // 10/11/2026 (terça-feira) às 08:07, horário local.
  const base = new Date(2026, 10, 10, 8, 7, 30);
  const fmt = (d) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;

  it('a cada 15 minutos', () => {
    expect(proximasExecucoes('*/15 * * * *', 3, base).map(fmt)).toEqual([
      '2026-11-10 8:15',
      '2026-11-10 8:30',
      '2026-11-10 8:45',
    ]);
  });

  it('dias úteis às 9h pula o fim de semana', () => {
    expect(proximasExecucoes('0 9 * * 1-5', 5, base).map(fmt)).toEqual([
      '2026-11-10 9:0',
      '2026-11-11 9:0',
      '2026-11-12 9:0',
      '2026-11-13 9:0',
      '2026-11-16 9:0',
    ]);
  });

  it('virada de ano', () => {
    expect(proximasExecucoes('0 0 1 1 *', 1, base).map(fmt)).toEqual(['2027-1-1 0:0']);
  });

  it('dia do mês OU dia da semana quando ambos são restritos', () => {
    expect(proximasExecucoes('0 12 15 * 0', 2, base).map(fmt)).toEqual([
      '2026-11-15 12:0', // domingo e dia 15
      '2026-11-22 12:0', // domingo
    ]);
  });

  it('retorna vazio quando nunca executa (31 de fevereiro)', () => {
    expect(proximasExecucoes('0 0 31 2 *', 5, base)).toEqual([]);
  });
});
