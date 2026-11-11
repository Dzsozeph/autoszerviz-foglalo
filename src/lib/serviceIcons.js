import { Droplets, Disc3, Gauge, Cpu, Wrench, ShieldCheck } from 'lucide-react';

export const ICON_OPTIONS = [
  { value: 'oil', label: 'Olajcsere' },
  { value: 'brake', label: 'Fék' },
  { value: 'suspension', label: 'Futómű' },
  { value: 'diagnostics', label: 'Diagnosztika' },
  { value: 'repair', label: 'Javítás' },
  { value: 'inspection', label: 'Vizsga' },
];

export const SERVICE_ICONS = {
  oil: Droplets,
  brake: Disc3,
  suspension: Gauge,
  diagnostics: Cpu,
  repair: Wrench,
  inspection: ShieldCheck,
};