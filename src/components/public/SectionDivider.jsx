/**
 * Visszafogott, modern szekcióelválasztó: vékony meleg vonal
 * finom narancs-sárga átmenettel és egy rövid középső kiemeléssel.
 */
export default function SectionDivider({ className = '' }) {
  return (
    <div aria-hidden="true" className={`relative h-px w-full bg-brand-line ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-ember/25 to-transparent" />
      <div className="absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-honey to-transparent" />
    </div>
  );
}