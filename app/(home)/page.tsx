import { HeroSection } from '@/modules/home/hero';
import { LogosSection } from '@/modules/home/hero/logos-section';

export default function Home() {
  return (
    <section className="mx-auto grow">
      <HeroSection />
      <LogosSection />
    </section>
  );
}
