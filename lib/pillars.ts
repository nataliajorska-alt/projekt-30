import type { PillarMeta } from '@/types'

export const PILLARS: PillarMeta[] = [
  {
    id: 'pozycja',
    name: 'Pozycja wewnętrzna',
    shortName: 'Wnętrze',
    icon: '🧭',
    color: '#2C3B35',
    bgColor: '#EEF3F1',
    description: 'Spokój, godność, regulacja emocji, siła bez braku',
  },
  {
    id: 'cialo',
    name: 'Ciało & Energia',
    shortName: 'Ciało',
    icon: '✨',
    color: '#7B5E3A',
    bgColor: '#F5EDE4',
    description: 'Sylwetka, ruch, pielęgnacja, energia, wyjściowość',
  },
  {
    id: 'styl',
    name: 'Styl & Aura',
    shortName: 'Styl',
    icon: '👑',
    color: '#B8963E',
    bgColor: '#FDF6E8',
    description: 'Elegancja, kobiecość, język, sposób bycia, klasa',
  },
  {
    id: 'kapital',
    name: 'Kapitał społeczny',
    shortName: 'Relacje',
    icon: '🌿',
    color: '#3D5247',
    bgColor: '#EBF2EE',
    description: 'Środowisko, relacje, zaproszenia, własny obieg',
  },
  {
    id: 'kariera',
    name: 'Kariera & Finanse',
    shortName: 'Kariera',
    icon: '💎',
    color: '#1A2420',
    bgColor: '#E8EDEB',
    description: 'Praca, pieniądze, pozycja zawodowa, autonomia',
  },
  {
    id: 'tozsamosc',
    name: 'Tożsamość premium',
    shortName: 'Tożsamość',
    icon: '📚',
    color: '#5A3E6B',
    bgColor: '#F0EAF5',
    description: 'Kultura, języki, hobby, jakość rozmowy, rozwój',
  },
  {
    id: 'milosc',
    name: 'Miłość & Standard',
    shortName: 'Miłość',
    icon: '🌹',
    color: '#8B3A3A',
    bgColor: '#F5EAEA',
    description: 'Standard relacyjny, wybór, godność w miłości',
  },
]

export const getPillar = (id: string): PillarMeta =>
  PILLARS.find(p => p.id === id) ?? PILLARS[0]
