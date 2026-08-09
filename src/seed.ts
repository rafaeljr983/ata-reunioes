import type { Ata } from './types'
import { uid } from './utils'

export function seedAtas(): Ata[] {
  const now = new Date()
  const d1 = new Date(now)
  d1.setDate(d1.getDate() - 2)
  const d2 = new Date(now)
  d2.setDate(d2.getDate() - 9)

  return [
    {
      id: uid('ata'),
      title: 'Alinhamento semanal do produto',
      date: d1.toISOString().slice(0, 10),
      time: '10:00',
      location: 'Sala 2 / Meet',
      facilitator: 'Ana Souza',
      participants: ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Martins'],
      agenda: '1. Métricas da semana\n2. Prioridades do sprint\n3. Riscos de lançamento',
      discussions:
        'Equipe revisou conversão do onboarding. Decou-se adiar a feature de relatórios para focar na estabilidade do app mobile.',
      decisions: [
        'Congelar escopo do sprint atual',
        'Abrir bug bash na sexta-feira',
      ],
      actions: [
        {
          id: uid('acao'),
          description: 'Publicar checklist de QA mobile',
          assignee: 'Bruno Lima',
          dueDate: new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10),
          done: false,
        },
        {
          id: uid('acao'),
          description: 'Atualizar roadmap com novo corte de escopo',
          assignee: 'Ana Souza',
          dueDate: new Date(now.getTime() + 5 * 86400000).toISOString().slice(0, 10),
          done: true,
        },
      ],
      status: 'rascunho',
      createdAt: d1.toISOString(),
      updatedAt: d1.toISOString(),
    },
    {
      id: uid('ata'),
      title: 'Comitê financeiro — agosto',
      date: d2.toISOString().slice(0, 10),
      time: '15:30',
      location: 'Presencial — Torre B',
      facilitator: 'Rafael Silva',
      participants: ['Rafael Silva', 'Helena Costa', 'Igor Nunes'],
      agenda: 'Orçamento Q3, fornecedores e aprovações pendentes.',
      discussions:
        'Foram analisadas propostas de dois fornecedores. Aprovado aumento de 8% no orçamento de infraestrutura.',
      decisions: [
        'Contratar fornecedor Alpha',
        'Revisar contrato de cloud em 30 dias',
      ],
      actions: [
        {
          id: uid('acao'),
          description: 'Enviar minuta do contrato para jurídico',
          assignee: 'Helena Costa',
          dueDate: new Date(d2.getTime() + 3 * 86400000).toISOString().slice(0, 10),
          done: true,
        },
      ],
      status: 'finalizada',
      createdAt: d2.toISOString(),
      updatedAt: d2.toISOString(),
    },
  ]
}
