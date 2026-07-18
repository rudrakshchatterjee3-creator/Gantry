import { FloodlightField } from "@/components/welcome/FloodlightField";
import { Hero } from "@/components/welcome/Hero";
import { FeatureScene } from "@/components/welcome/FeatureScene";
import { GateLoadDemo } from "@/components/welcome/motion/GateLoadDemo";
import { ConciergeDemo } from "@/components/welcome/motion/ConciergeDemo";
import { VenueSwitchDemo } from "@/components/welcome/motion/VenueSwitchDemo";
import { OfficialAuthForm } from "@/components/welcome/OfficialAuthForm";

export default function WelcomePage() {
  return (
    <div className="relative min-h-screen">
      <FloodlightField />

      <Hero />

      <FeatureScene
        eyebrow="Crowd Intelligence"
        title="See gate pressure before it becomes a bottleneck."
        description="Real transit density and live local time drive a matchday-aware model of gate load across all four sides of every venue — no fabricated sensor data, ever."
      >
        <GateLoadDemo />
      </FeatureScene>

      <FeatureScene
        eyebrow="Ask Gantry"
        title="A GenAI concierge fans can actually talk to."
        description="Voice in, voice out — powered by the browser, not a paid API. Ask about accessible gates, transit, weather, or wait times and get grounded, live answers."
        reverse
      >
        <ConciergeDemo />
      </FeatureScene>

      <FeatureScene
        eyebrow="Every Host City"
        title="One dashboard, all 16 World Cup venues."
        description="From MetLife to Estadio Azteca to BC Place — switch venues and every map, forecast, and conversation re-grounds itself in real local data instantly."
      >
        <VenueSwitchDemo />
      </FeatureScene>

      <section id="sign-in" className="flex flex-col items-center gap-6 px-6 py-28 text-center">
        <h2 className="font-display text-3xl font-bold uppercase text-floodlight sm:text-4xl">
          Ready for kickoff.
        </h2>
        <p className="max-w-md text-sm text-slate-400">
          Sign in to open the operations dashboard.
        </p>
        <OfficialAuthForm />
      </section>
    </div>
  );
}
