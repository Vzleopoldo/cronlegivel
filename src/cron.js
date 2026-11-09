// Núcleo do CronLegível: valida, descreve em português e calcula as próximas
// execuções de uma expressão cron de 5 campos (minuto hora dia mês dia-da-semana).
// Funções puras: sem acesso ao DOM, para serem testadas isoladamente.

const CAMPOS = [
  { nome: 'minuto', min: 0, max: 59 },
  { nome: 'hora', min: 0, max: 23 },
  { nome: 'dia do mês', min: 1, max: 31 },
  { nome: 'mês', min: 1, max: 12 },
  { nome: 'dia da semana', min: 0, max: 7 },
];

const ATALHOS = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DIAS_PLURAL = [
  'aos domingos', 'às segundas', 'às terças', 'às quartas',
  'às quintas', 'às sextas', 'aos sábados',
];

export class CronInvalido extends Error {}

function parseCampo(bruto, def) {
  const partes = bruto.split(',').map((parte) => {
    const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(parte);
    if (!m) {
      throw new CronInvalido(`Campo "${def.nome}": "${parte}" não é um valor válido.`);
    }
    const [, base, passoTxt] = m;
    const passo = passoTxt === undefined ? 1 : Number(passoTxt);
    if (passo < 1) {
      throw new CronInvalido(`Campo "${def.nome}": o passo deve ser maior que zero.`);
    }

    let inicio = def.min;
    let fim = def.max;
    const asterisco = base === '*';
    if (!asterisco) {
      const [a, b] = base.split('-').map(Number);
      inicio = a;
      // "5/15" significa "a partir de 5, de 15 em 15" até o máximo do campo.
      fim = b !== undefined ? b : passoTxt !== undefined ? def.max : a;
    }
    for (const v of [inicio, fim]) {
      if (v < def.min || v > def.max) {
        throw new CronInvalido(
          `Campo "${def.nome}": ${v} está fora do intervalo ${def.min}–${def.max}.`,
        );
      }
    }
    if (inicio > fim) {
      throw new CronInvalido(`Campo "${def.nome}": intervalo ${inicio}-${fim} invertido.`);
    }
    return { asterisco, inicio, fim, passo, temPasso: passoTxt !== undefined };
  });

  const valores = new Set();
  for (const p of partes) {
    for (let v = p.inicio; v <= p.fim; v += p.passo) {
      // No dia da semana, 7 também é domingo.
      valores.add(def.nome === 'dia da semana' && v === 7 ? 0 : v);
    }
  }
  return { bruto, partes, valores, asterisco: bruto.startsWith('*') };
}

/** Converte o texto em estrutura; lança CronInvalido com mensagem em português. */
export function parseCron(expressao) {
  const texto = String(expressao ?? '').trim();
  const normalizada = ATALHOS[texto.toLowerCase()] ?? texto;
  const campos = normalizada.split(/\s+/).filter(Boolean);
  if (campos.length !== 5) {
    throw new CronInvalido(
      `A expressão precisa de 5 campos (minuto hora dia mês dia-da-semana); recebi ${campos.length}.`,
    );
  }
  const [minuto, hora, diaMes, mes, diaSemana] = campos.map((c, i) => parseCampo(c, CAMPOS[i]));
  return { minuto, hora, diaMes, mes, diaSemana };
}

// ---------- descrição em português ----------

function juntar(itens) {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

const doisDigitos = (n) => String(n).padStart(2, '0');

// Descreve um campo parte a parte; valores soltos são agrupados numa só frase.
function descreverCampo(campo, r) {
  if (campo.bruto === '*') return '';
  const soltos = [];
  const frases = [];
  for (const p of campo.partes) {
    if (!p.temPasso && p.inicio === p.fim) {
      soltos.push(p.inicio);
    } else if (!p.temPasso) {
      frases.push(r.intervalo(p.inicio, p.fim));
    } else if (p.asterisco) {
      frases.push(r.passo(p.passo));
    } else if (p.fim === r.max) {
      frases.push(`${r.passo(p.passo)} a partir ${r.aPartir(p.inicio)}`);
    } else {
      frases.push(`${r.passo(p.passo)}, ${r.intervalo(p.inicio, p.fim)}`);
    }
  }
  if (soltos.length) frases.unshift(r.soltos(soltos));
  return juntar(frases);
}

const REGRAS = {
  minuto: {
    max: 59,
    soltos: (vs) => (vs.length === 1 ? `no minuto ${vs[0]}` : `nos minutos ${juntar(vs.map(String))}`),
    intervalo: (a, b) => `do minuto ${a} ao ${b}`,
    passo: (n) => (n === 1 ? 'a cada minuto' : `a cada ${n} minutos`),
    aPartir: (a) => `do minuto ${a}`,
  },
  hora: {
    max: 23,
    soltos: (vs) => `às ${juntar(vs.map((v) => `${v}h`))}`,
    intervalo: (a, b) => `das ${a}h00 às ${b}h59`,
    passo: (n) => (n === 1 ? 'a cada hora' : `a cada ${n} horas`),
    aPartir: (a) => `das ${a}h`,
  },
  diaMes: {
    max: 31,
    soltos: (vs) =>
      vs.length === 1 ? `no dia ${vs[0]} do mês` : `nos dias ${juntar(vs.map(String))} do mês`,
    intervalo: (a, b) => `do dia ${a} ao ${b} do mês`,
    passo: (n) => (n === 1 ? 'todo dia' : `a cada ${n} dias`),
    aPartir: (a) => `do dia ${a}`,
  },
  mes: {
    max: 12,
    soltos: (vs) => `em ${juntar(vs.map((v) => MESES[v - 1]))}`,
    intervalo: (a, b) => `de ${MESES[a - 1]} a ${MESES[b - 1]}`,
    passo: (n) => (n === 1 ? 'todo mês' : `a cada ${n} meses`),
    aPartir: (a) => `de ${MESES[a - 1]}`,
  },
  diaSemana: {
    max: 7,
    soltos: (vs) => juntar(vs.map((v) => DIAS_PLURAL[v % 7])),
    intervalo: (a, b) => `de ${DIAS[a % 7]} a ${DIAS[b % 7]}`,
    passo: (n) => `a cada ${n} dias da semana`,
    aPartir: (a) => `de ${DIAS[a % 7]}`,
  },
};

const soValoresSoltos = (campo) =>
  !campo.asterisco && campo.partes.every((p) => !p.temPasso && p.inicio === p.fim);

function descreverHorario(c) {
  // Horário exato: "às 09:30" ou "às 09:30 e 18:30".
  if (soValoresSoltos(c.minuto) && c.minuto.valores.size === 1 && soValoresSoltos(c.hora)) {
    const [m] = c.minuto.valores;
    const horas = [...c.hora.valores].sort((a, b) => a - b);
    return { texto: `às ${juntar(horas.map((h) => `${doisDigitos(h)}:${doisDigitos(m)}`))}`, exato: true };
  }
  const minutos = descreverCampo(c.minuto, REGRAS.minuto) || 'a cada minuto';
  if (c.hora.bruto === '*') {
    const sufixo = soValoresSoltos(c.minuto) ? ' de cada hora' : '';
    return { texto: minutos + sufixo, exato: false };
  }
  return { texto: `${minutos}, ${descreverCampo(c.hora, REGRAS.hora)}`, exato: false };
}

/** Retorna a frase em português que descreve a expressão. */
export function descreverCron(expressao) {
  const c = parseCron(expressao);
  const horario = descreverHorario(c);
  const diaMes = descreverCampo(c.diaMes, REGRAS.diaMes);
  const diaSemana = descreverCampo(c.diaSemana, REGRAS.diaSemana);
  const mes = descreverCampo(c.mes, REGRAS.mes);

  let dias;
  if (diaMes && diaSemana) dias = `${diaMes} ou ${diaSemana}`;
  else dias = diaMes || diaSemana || (horario.exato && !mes ? 'todos os dias' : '');

  const frase = [horario.texto, dias, mes].filter(Boolean).join(', ');
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

// ---------- próximas execuções ----------

function casaDia(c, data) {
  const okMes = c.diaMes.valores.has(data.getDate());
  const okSemana = c.diaSemana.valores.has(data.getDay());
  // Regra do cron: se os dois campos são restritos, basta um deles casar.
  if (!c.diaMes.asterisco && !c.diaSemana.asterisco) return okMes || okSemana;
  return okMes && okSemana;
}

/**
 * Calcula as próximas `quantidade` execuções depois de `apartir` (horário local).
 * Retorna lista vazia se a expressão nunca executa (ex.: 31 de fevereiro).
 */
export function proximasExecucoes(expressao, quantidade = 5, apartir = new Date()) {
  const c = parseCron(expressao);
  const d = new Date(apartir);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);

  const limite = new Date(d);
  limite.setFullYear(limite.getFullYear() + 5);

  const resultado = [];
  while (resultado.length < quantidade && d < limite) {
    if (!c.mes.valores.has(d.getMonth() + 1)) {
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0);
    } else if (!casaDia(c, d)) {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0);
    } else if (!c.hora.valores.has(d.getHours())) {
      d.setHours(d.getHours() + 1, 0);
    } else if (!c.minuto.valores.has(d.getMinutes())) {
      d.setMinutes(d.getMinutes() + 1);
    } else {
      resultado.push(new Date(d));
      d.setMinutes(d.getMinutes() + 1);
    }
  }
  return resultado;
}
