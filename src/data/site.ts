import contato from '../content/_config/contato.json';

// Cache-busting: a Vercel define VERCEL_GIT_COMMIT_SHA em todo build.
// Adicionamos ?v=<hash> em assets dinâmicos para forçar reload quando o
// conteúdo é substituído (mesmo caminho, conteúdo novo).
const buildId = (process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 8);
export function bust(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'v=' + buildId;
}

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
  logo: contato.logo || '',
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

// "Projetos selecionados" agora é uma collection do CMS: src/content/projetos
// (editável em /admin, seção "Projetos selecionados").
