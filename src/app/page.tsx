import {
  Navbar,
  Hero,
  HowItWorks,
  AgentAI,
  Credits,
  MLM,
  TechStack,
  Pricing,
  FAQ,
  Footer,
} from '@/components/marketing';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <AgentAI />
        <Credits />
        <MLM />
        <TechStack />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
