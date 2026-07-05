const FEATURES = [
  {
    title: "Pick up exactly where you stopped",
    desc: "Your page, scroll position, and progress sync automatically — switch devices without losing your place.",
    color: "text-primary",
  },
  {
    title: "Built for focused learners",
    desc: "Dark, sepia, and light reading modes, adjustable fonts, and a distraction-free layout.",
    color: "text-secondary",
  },
  {
    title: "A growing free library",
    desc: "Cybersecurity, programming, self-improvement, and more — with new collections added regularly.",
    color: "text-accent",
  },
];

export default function Features() {
  return (
    <section className="px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {FEATURES.map((f) => (
        <div key={f.title} className="glass rounded-xl2 p-6">
          <h3 className={`font-semibold mb-2 ${f.color}`}>{f.title}</h3>
          <p className="text-white/60 text-sm">{f.desc}</p>
        </div>
      ))}
    </section>
  );
}
