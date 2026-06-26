import contato from '../content/_config/contato.json';

export const site = {
  name: contato.name,
  role: contato.role,
  shortBio: contato.shortBio,
  location: contato.location,
  email: contato.email,
  phone: contato.phone,
  phoneDigits: contato.phoneDigits,
  phoneHref: `tel:+${contato.phoneDigits}`,
  whatsappHref: `https://wa.me/${contato.phoneDigits}`,
  github: contato.github,
  hero: contato.hero || '/img/marcus.jpg',
  url: 'https://bragantini.com.br',
  nav: [
    { label: 'Início', href: '/' },
    { label: 'Sobre', href: '/sobre' },
    { label: 'Experiência', href: '/experiencia' },
    { label: 'BECAPE', href: '/becape' },
    { label: 'Jogo', href: '/jogo' },
    { label: 'Contato', href: '/contato' },
  ],
} as const;

export const skills = [
  { name: 'Automação industrial', level: 'Avançado', detail: 'Termoplásticos, manutenção, retrofitting, eficiência energética' },
  { name: 'IHM & PLC', level: 'Avançado', detail: 'Programação e idealização de telas de IHM' },
  { name: 'Inventor (CAD 3D)', level: 'Avançado', detail: 'Peças, montagens, desenhos de fabricação, vistas projetadas' },
  { name: 'Mecânica industrial', level: 'Intermediário', detail: 'Projeto, montagem, manutenção' },
  { name: 'HTML, CSS, JavaScript', level: 'Intermediário', detail: 'Front-end, sites estáticos, ferramentas internas' },
  { name: 'Montagem de painéis', level: 'Avançado', detail: 'Elétrica, desenhos, montagem' },
] as const;

export const trabalhos = [
  {
    titulo: 'Auto-atendimento de gás',
    categoria: 'Automação industrial',
    descricao:
      'Projeto de automação industrial para auto-atendimento de gás. Participei desde o conceito, passando pelos desenhos e pela montagem.',
    imagem: '/img/auto-atendimento-gas.jpg',
    creditos: [
      { papel: 'Projeto', nome: 'Bernardo Almeida' },
      { papel: 'Desenhista', nome: 'Marcus Bragantini' },
      { papel: 'Montador', nome: 'Marcus Bragantini' },
    ],
  },
  {
    titulo: 'Reparo de inversor',
    categoria: 'Manutenção industrial',
    descricao:
      'Diagnóstico e reparo de inversor de frequência danificado, devolvendo o equipamento à operação plena.',
    imagem: '/img/inversor-reparado.jpg',
    creditos: [{ papel: 'Manutenção', nome: 'Marcus Bragantini' }],
  },
  {
    titulo: 'Montagem de painéis elétricos',
    categoria: 'Elétrica industrial',
    descricao:
      'Da leitura do diagrama elétrico à montagem física do painel: cabeamento, identificação, comissionamento.',
    imagem: '/img/montagem-painel.jpg',
    creditos: [{ papel: 'Execução', nome: 'Marcus Bragantini' }],
  },
];
