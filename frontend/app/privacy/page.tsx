'use client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main style={{ padding: '48px 24px 80px', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: '6px', color: '#fff' }}>POLITIQUE DE CONFIDENTIALITÉ</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>
              Fight Data Arena — Dernière mise à jour : juin 2026
            </div>
          </div>

          {[
            {
              title: 'DONNÉES COLLECTÉES',
              body: `Lorsque vous vous connectez avec Discord, nous collectons uniquement :
• Votre identifiant Discord (discord_id) — identifiant unique anonyme
• Votre pseudo Discord (username)

Nous ne collectons pas votre email, votre avatar, vos serveurs, vos messages, ni aucune autre donnée Discord.`,
            },
            {
              title: 'POURQUOI CES DONNÉES ?',
              body: `Ces données servent exclusivement à :
• Sauvegarder votre progression (succès, statistiques, historique de parties)
• Afficher votre pseudo dans les classements
• Maintenir votre session de connexion (60 jours)`,
            },
            {
              title: 'DONNÉES LOCALES',
              body: `Sans connexion Discord, vos données (statistiques, succès, historique) sont stockées uniquement dans le localStorage de votre navigateur. Ces données ne quittent jamais votre appareil sauf si vous vous connectez volontairement.`,
            },
            {
              title: 'CLASSEMENTS PUBLICS',
              body: `Si vous participez à un classement (Survival, Flash, Global), votre pseudo est visible publiquement. Vous pouvez utiliser un pseudo différent de votre nom Discord.`,
            },
            {
              title: 'DURÉE DE CONSERVATION',
              body: `Vos données sont conservées tant que votre compte est actif. Les comptes sans activité depuis plus de 12 mois peuvent être supprimés automatiquement.`,
            },
            {
              title: 'VOS DROITS (RGPD)',
              body: `Vous disposez des droits suivants :
• Accès : vos données sont visibles sur votre page Profil
• Rectification : votre pseudo est modifiable sur votre Profil
• Effacement : suppression complète via le bouton "Supprimer mon compte" sur votre Profil
• Portabilité : vos données peuvent être exportées sur demande

Pour toute demande : dembelematis@gmail.com`,
            },
            {
              title: 'ANALYTICS',
              body: `Nous utilisons Vercel Analytics pour mesurer l'audience du site (pages visitées, pays, navigateur). Ces données sont agrégées et anonymes. Aucun cookie de tracking tiers n'est utilisé.`,
            },
          ].map(({ title, body }) => (
            <div key={title} style={{ borderLeft: '2px solid rgba(88,101,242,0.4)', paddingLeft: '20px' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-3)', color: '#5865F2', marginBottom: '10px' }}>{title}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-1)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>{body}</div>
            </div>
          ))}

          <div style={{ marginTop: '8px' }}>
            <Link href="/" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'var(--fs-xs)', letterSpacing: 'var(--ls-2)', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
              ← RETOUR À L'ACCUEIL
            </Link>
          </div>

        </div>
      </main>
    </>
  )
}
