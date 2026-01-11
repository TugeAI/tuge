import { Navbar, Footer } from '@/components/marketing';
import { BRAND } from '@/config/brand';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Tuge AI',
  description: 'Politique de confidentialité et protection des données personnelles de Tuge AI',
};

export default function Confidentialite() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-[var(--bg-secondary)]">
        <div className="container-main max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Politique de confidentialité
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Comment nous collectons et protégeons vos données
            </p>
          </div>

          {/* Content */}
          <div className="card-premium p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Introduction
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Chez {BRAND.name}, nous accordons une importance primordiale à la protection de votre vie privée et de vos données personnelles.
                </p>
                <p>
                  La présente politique de confidentialité a pour but de vous informer sur la manière dont nous collectons, utilisons, partageons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
                </p>
              </div>
            </section>

            {/* Responsable du traitement */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Responsable du traitement
              </h2>
              <div className="text-[var(--text-secondary)] space-y-2">
                <p>
                  Le responsable du traitement des données est :
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">TO US GETHER SASU</strong><br />
                  Nom commercial : {BRAND.name}<br />
                  Siège social : 6 rue Rose Dieng-Kuntz, 44300 Nantes, France<br />
                  SIREN : 952 276 939<br />
                  Email : <a href={`mailto:${BRAND.supportEmail}`} className="text-[var(--brand-violet)] hover:underline">{BRAND.supportEmail}</a>
                </p>
              </div>
            </section>

            {/* Données collectées */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Données personnelles collectées
              </h2>
              <div className="text-[var(--text-secondary)] space-y-4">
                <p>
                  Nous collectons et traitons les données personnelles suivantes :
                </p>
                
                <div className="ml-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                      Données d&apos;identification
                    </h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Nom et prénom</li>
                      <li>Adresse email</li>
                      <li>Numéro de téléphone (optionnel)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                      Données de connexion
                    </h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Adresse IP</li>
                      <li>Données de navigation (pages visitées, durée de visite)</li>
                      <li>Type de navigateur et système d&apos;exploitation</li>
                      <li>Cookies et traceurs</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                      Données d&apos;utilisation
                    </h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Historique des conversations avec l&apos;agent IA</li>
                      <li>Annonces créées et publiées</li>
                      <li>Transactions et utilisation des crédits</li>
                      <li>Données de parrainage</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Finalités */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Finalités du traitement
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Vos données personnelles sont collectées et traitées pour les finalités suivantes :
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Création et gestion de votre compte utilisateur</li>
                  <li>Fourniture et amélioration des services de la plateforme</li>
                  <li>Communication avec vous (support, notifications, mises à jour)</li>
                  <li>Traitement des transactions et gestion des crédits</li>
                  <li>Personnalisation de votre expérience utilisateur</li>
                  <li>Analyse statistique et amélioration de nos services</li>
                  <li>Prévention de la fraude et sécurité de la plateforme</li>
                  <li>Respect de nos obligations légales</li>
                  <li>Gestion du programme de parrainage</li>
                </ul>
              </div>
            </section>

            {/* Base légale */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Base légale du traitement
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Le traitement de vos données personnelles repose sur les bases légales suivantes :
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>
                    <strong className="text-[var(--text-primary)]">Exécution du contrat :</strong> pour la fourniture des services que vous avez souscrits
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Consentement :</strong> pour l&apos;utilisation de cookies non essentiels et l&apos;envoi de communications marketing
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Intérêt légitime :</strong> pour l&apos;amélioration de nos services, la sécurité et la prévention de la fraude
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Obligation légale :</strong> pour le respect de nos obligations comptables et fiscales
                  </li>
                </ul>
              </div>
            </section>

            {/* Conservation */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Durée de conservation
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Vos données personnelles sont conservées pour la durée nécessaire aux finalités pour lesquelles elles sont traitées :
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>
                    <strong className="text-[var(--text-primary)]">Données de compte :</strong> pendant toute la durée de votre inscription, puis 3 ans après votre dernière activité
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Données de transaction :</strong> 10 ans conformément aux obligations comptables
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Données de navigation :</strong> 13 mois maximum
                  </li>
                </ul>
                <p>
                  À l&apos;issue de ces délais, vos données sont supprimées ou anonymisées.
                </p>
              </div>
            </section>

            {/* Destinataires */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Destinataires des données
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Vos données personnelles peuvent être transmises aux catégories de destinataires suivantes :
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Personnel habilité de {BRAND.name}</li>
                  <li>Prestataires techniques (hébergement, maintenance, support)</li>
                  <li>Prestataires de paiement (Stripe)</li>
                  <li>Services d&apos;analyse et de statistiques</li>
                  <li>Autorités compétentes, sur demande légale</li>
                </ul>
                <p>
                  Tous nos prestataires sont soumis à des obligations strictes de confidentialité et de sécurité.
                </p>
              </div>
            </section>

            {/* Transferts */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Transferts hors UE
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Certaines de vos données peuvent être transférées vers des pays situés hors de l&apos;Union Européenne, notamment :
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>États-Unis (hébergement Vercel, services cloud)</li>
                </ul>
                <p>
                  Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types de la Commission Européenne) pour assurer un niveau de protection adéquat de vos données.
                </p>
              </div>
            </section>

            {/* Vos droits */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Vos droits
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>
                    <strong className="text-[var(--text-primary)]">Droit d&apos;accès :</strong> obtenir la confirmation que vos données sont traitées et accéder à ces données
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Droit de rectification :</strong> corriger vos données inexactes ou incomplètes
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Droit à l&apos;effacement :</strong> obtenir la suppression de vos données dans certains cas
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Droit à la limitation :</strong> limiter le traitement de vos données dans certaines situations
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Droit à la portabilité :</strong> recevoir vos données dans un format structuré
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Droit d&apos;opposition :</strong> vous opposer au traitement de vos données pour des raisons tenant à votre situation particulière
                  </li>
                  <li>
                    <strong className="text-[var(--text-primary)]">Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement
                  </li>
                </ul>
                <p className="mt-4">
                  Pour exercer vos droits, contactez-nous à l&apos;adresse :{' '}
                  <a href={`mailto:${BRAND.supportEmail}`} className="text-[var(--brand-violet)] hover:underline font-medium">
                    {BRAND.supportEmail}
                  </a>
                </p>
                <p>
                  Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL (Commission Nationale de l&apos;Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-violet)] hover:underline">www.cnil.fr</a>
                </p>
              </div>
            </section>

            {/* Sécurité */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Sécurité des données
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre la destruction, la perte, l&apos;altération, la divulgation non autorisée ou l&apos;accès non autorisé :
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Chiffrement des données sensibles (SSL/TLS)</li>
                  <li>Authentification sécurisée et gestion des accès</li>
                  <li>Surveillance et journalisation des activités</li>
                  <li>Sauvegardes régulières</li>
                  <li>Tests de sécurité réguliers</li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Cookies et traceurs
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Notre site utilise des cookies pour améliorer votre expérience et analyser l&apos;utilisation de nos services.
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Cookies strictement nécessaires :</strong> indispensables au fonctionnement du site (authentification, sécurité). Ils ne nécessitent pas votre consentement.
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Cookies analytiques :</strong> nous permettent de mesurer l&apos;audience et d&apos;améliorer nos services. Vous pouvez les refuser.
                </p>
                <p>
                  Vous pouvez gérer vos préférences en matière de cookies via les paramètres de votre navigateur.
                </p>
              </div>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Modifications de la politique
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page avec une nouvelle date de mise à jour.
                </p>
                <p>
                  Nous vous encourageons à consulter régulièrement cette page pour rester informé de la manière dont nous protégeons vos données.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Contact
              </h2>
              <div className="text-[var(--text-secondary)] space-y-3">
                <p>
                  Pour toute question concernant cette politique de confidentialité ou le traitement de vos données personnelles, vous pouvez nous contacter :
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">Par email :</strong>{' '}
                  <a href={`mailto:${BRAND.supportEmail}`} className="text-[var(--brand-violet)] hover:underline">
                    {BRAND.supportEmail}
                  </a>
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

