import { descreverCron, proximasExecucoes } from './cron.js';

const entrada = document.getElementById('expressao');
const descricao = document.getElementById('descricao');
const erro = document.getElementById('erro');
const titulo = document.getElementById('titulo-proximas');
const lista = document.getElementById('proximas');

const formato = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function atualizar() {
  lista.replaceChildren();
  try {
    descricao.textContent = descreverCron(entrada.value);
    erro.textContent = '';
    titulo.hidden = false;
    const datas = proximasExecucoes(entrada.value, 5);
    if (datas.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'Nunca executa nos próximos 5 anos (data impossível?).';
      lista.append(item);
    }
    for (const d of datas) {
      const item = document.createElement('li');
      item.textContent = formato.format(d);
      lista.append(item);
    }
    entrada.removeAttribute('aria-invalid');
  } catch (e) {
    descricao.textContent = '';
    erro.textContent = e.message;
    titulo.hidden = true;
    entrada.setAttribute('aria-invalid', 'true');
  }
}

entrada.addEventListener('input', atualizar);
document.querySelectorAll('[data-cron]').forEach((botao) => {
  botao.addEventListener('click', () => {
    entrada.value = botao.dataset.cron;
    atualizar();
  });
});

atualizar();
