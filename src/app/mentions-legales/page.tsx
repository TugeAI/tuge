import { Navbar, Footer } from '@/components/marketing';
import { BRAND } from '@/config/brand';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales | Tuge AI',
  description: 'Mentions légales et informations juridiques de Tuge AI',
};

export default function MentionsLegales() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-[var(--bg-secondary)]">
        <div className="container-main max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Mentions légales
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Informations juridiques et éditoriales
            </p>
          </div>

          {/* Content */}
          <div className="card-premium p-8 md:p-12 space-y-8">
            {/* Éditeur */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Éditeur du site
              </h2>
              <div className="text-[var(--text-secondary)] space-y-2">
                <p>
                  <strong className="text-[var(--text-primary)]">Dénomination sociale :</strong> TO US GETHER SASU
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Nom commercial :</strong> {BRAND.name}
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Forme juridique :</strong> SASU (Société par Actions Simplifiée Unipersonnelle)
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Siège social :</strong> 6 rue Rose Dieng-Kuntz, 44300 Nantes, France
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">SIREN :</strong> 952 276 939
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Code APE :</strong> 7010Z - Activités des sièges sociaux
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Immatriculation RNE :</strong> 12/05/2023
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Email :</strong>{' '}
                  <a href={`mailto:${BRAND.supportEmail}`} className="text-[var(--brand-violet)] hover:underline">
                    {BRAND.supportEmail}
                  </a>
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Directeur de publication :</strong> Le représentant légal de TO US GETHER SASU
                </p>
              </div>
            </section>

            {/* Hébergeur */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Hébergeur
              </h2>
              <div className="text-[var(--text-secondary)] space-y-2">
                <p>
                  <strong className="text-[var(--text-primary)]">Nom :</strong> Vercel Inc.
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Site web :</strong>{' '}
                  <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-violet)] hover:underline">
                    vercel.com
                  </a>
                </p>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Propriété intellectuelle
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  L&apos;ensemble du contenu de ce site (textes, images, logos, icônes, graphismes, codes sources, etc.) est la propriété exclusive de {BRAND.name} ou de ses partenaires, sauf mention contraire.
                </p>
                <p>
                  Toute reproduction, représentation, modification, publication ou adaptation totale ou partielle des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l&apos;autorisation écrite préalable de {BRAND.name}.
                </p>
                <p>
                  Le non-respect de cette interdiction constitue une contrefaçon susceptible d&apos;engager la responsabilité civile et pénale du contrefacteur.
                </p>
              </div>
            </section>

            {/* Données personnelles */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Protection des données personnelles
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et d&apos;opposition aux données personnelles vous concernant.
                </p>
                <p>
                  Pour plus d'informations sur la collecte et le traitement de vos données personnelles, consultez notre{' '}
                  <a href="/confidentialite" className="text-[var(--brand-violet)] hover:underline font-medium">
                    Politique de confidentialité
                  </a>.
                </p>
                <p>
                  Pour exercer vos droits, contactez-nous à l&apos;adresse :{' '}
                  <a href={`mailto:${BRAND.supportEmail}`} className="text-[var(--brand-violet)] hover:underline">
                    {BRAND.supportEmail}
                  </a>
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Cookies
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Ce site utilise des cookies pour améliorer votre expérience de navigation et pour des besoins de statistiques et d&apos;analyse d&apos;audience.
                </p>
                <p>
                  Vous pouvez à tout moment désactiver les cookies dans les paramètres de votre navigateur. Cependant, certaines fonctionnalités du site pourraient être limitées.
                </p>
              </div>
            </section>

            {/* Responsabilité */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Limitation de responsabilité
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  {BRAND.name} s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site, dont elle se réserve le droit de corriger le contenu à tout moment et sans préavis.
                </p>
                <p>
                  Toutefois, {BRAND.name} ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à disposition sur ce site.
                </p>
                <p>
                  {BRAND.name} ne saurait être tenue responsable des dommages directs ou indirects qui pourraient résulter de l&apos;accès au site ou de l&apos;utilisation du site et/ou des informations qui y figurent.
                </p>
              </div>
            </section>

            {/* Liens hypertextes */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Liens hypertextes
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Ce site peut contenir des liens hypertextes vers d&apos;autres sites. {BRAND.name} n&apos;exerce aucun contrôle sur ces sites externes et décline toute responsabilité quant à leur contenu.
                </p>
                <p>
                  La création de liens hypertextes vers ce site est soumise à l&apos;accord préalable de {BRAND.name}.
                </p>
              </div>
            </section>

            {/* Droit applicable */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Droit applicable et juridiction
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Les présentes mentions légales sont régies par le droit français.
                </p>
                <p>
                  En cas de litige et à défaut d&apos;accord amiable, le litige sera porté devant les tribunaux français conformément aux règles de compétence en vigueur.
                </p>
              </div>
            </section>

            {/* Date de mise à jour */}
            <section className="pt-8 border-t border-[var(--border-primary)]">
              <p className="text-sm text-[var(--text-muted)] text-center">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

