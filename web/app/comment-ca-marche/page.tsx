import { Search, Calendar, CheckCircle } from 'lucide-react';

const steps = [
  { num: '01', icon: <Search className="w-6 h-6" />, title: 'Recherchez', desc: 'Trouvez un médecin par spécialité, nom ou localisation à Conakry et partout en Guinée.' },
  { num: '02', icon: <Calendar className="w-6 h-6" />, title: 'Réservez', desc: 'Choisissez un créneau disponible et confirmez votre rendez-vous en quelques secondes.' },
  { num: '03', icon: <CheckCircle className="w-6 h-6" />, title: 'Consultez', desc: "Rendez-vous sur place ou en ligne. Recevez votre ordonnance directement sur l'appli." },
];

export const metadata = {
  title: 'Comment ça marche · Mondocteur',
  description: 'Trois étapes simples pour trouver un professionnel de santé et prendre rendez-vous avec Mondocteur.',
};

export default function CommentCaMarchePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 bg-mist-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Mondocteur</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900 mt-2 mb-4">Comment ça marche</h1>
          <p className="text-ink-400 text-lg max-w-xl">
            Prendre rendez-vous avec un professionnel de santé n&apos;a jamais été aussi simple.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={i} className="relative flex items-start gap-4">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%+0.5rem)] w-[calc(100%-3rem)] border-t-2 border-dashed border-ink-100" />
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="w-9 h-9 rounded-full bg-mist-100 text-primary font-bold flex items-center justify-center text-sm">{i + 1}</span>
                  <span className="text-primary">{step.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 mb-1">{step.title}</h3>
                  <p className="text-ink-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
