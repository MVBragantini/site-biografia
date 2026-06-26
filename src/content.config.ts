import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const manuais = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/manuais' }),
  schema: z.object({
    nome: z.string(),
    fabricante: z.string().optional(),
    categoria: z.string(),
    pdf: z.string(),
    revisao: z.string().optional(),
    observacao: z.string().optional(),
    adicionadoEm: z.coerce.date().optional(),
  }),
});

const fotos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/fotos' }),
  schema: z.object({
    titulo: z.string(),
    descricao: z.string().optional(),
    imagem: z.string(),
    categoria: z.string(),
    local: z.string().optional(),
    data: z.coerce.date().optional(),
  }),
});

export const collections = { manuais, fotos };
