import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { fr } from 'vuetify/locale'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  locale: {
    locale: 'fr',
    messages: { fr },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          // Couleurs principales - Bleu foncé et gris bleu
          primary: '#1E3A8A', // Bleu foncé (couleur primaire principale)
          secondary: '#475569', // Gris bleu (couleur secondaire)
          accent: '#3B82F6', // Bleu royal (couleur d'accent)
          error: '#DC143C', // Rouge crimson (couleur d'erreur)
          info: '#0EA5E9', // Bleu ciel (couleur d'information)
          success: '#059669', // Vert émeraude (couleur de succès)
          warning: '#D97706', // Orange (couleur d'avertissement)

          // Couleurs de surface - Gris bleu subtils
          background: '#F8FAFC', // Couleur de fond principale (gris très clair avec teinte bleue)
          surface: '#FFFFFF', // Couleur de surface principale (blanc)
          'surface-variant': '#E2E8F0', // Variante de surface (gris bleu très clair)
          'surface-bright': '#FFFFFF', // Surface brillante (blanc)
          'surface-dim': '#F1F5F9', // Surface atténuée (gris bleu clair)

          // Couleurs de texte
          'on-background': '#0F172A', // Texte sur fond (gris très foncé avec teinte bleue)
          'on-surface': '#0F172A', // Texte sur surface (gris très foncé avec teinte bleue)
          'on-surface-variant': '#334155', // Texte sur variante de surface (gris bleu moyen)
          'text-primary': '#0F172A', // Texte principal (gris très foncé avec teinte bleue)
          'text-secondary': '#1E3A8A', // Texte secondaire (bleu foncé)
          'text-disabled': '#64748B', // Texte désactivé (gris bleu)

          // Couleurs primaires avec variations - Bleu foncé
          'primary-base': '#1E3A8A', // Couleur primaire de base
          'primary-darken-1': '#1E40AF', // Couleur primaire plus foncée
          'primary-darken-2': '#1E3A8A', // Couleur primaire encore plus foncée
          'primary-lighten-1': '#2563EB', // Couleur primaire plus claire
          'primary-lighten-2': '#3B82F6', // Couleur primaire encore plus claire
          'primary-lighten-3': '#60A5FA', // Couleur primaire très claire
          'primary-lighten-4': '#93C5FD', // Couleur primaire ultra claire
          'primary-lighten-5': '#DBEAFE', // Couleur primaire la plus claire

          // Couleurs de succès avec variations
          'success-base': '#059669', // Couleur de succès de base
          'success-lighten-4': '#A7F3D0', // Couleur de succès claire
          'success-lighten-5': '#D1FAE5', // Couleur de succès très claire

          // Couleurs d'erreur avec variations
          'error-base': '#FF5252', // Couleur d'erreur de base

          // Couleurs d'outline et ombres
          outline: '#CBD5E1', // Couleur de contour (gris bleu clair)
          'shadow-key-umbra-opacity': '0.15', // Opacité d'ombre (plus subtile)

          // Variables supplémentaires pour les containers
          'primary-container': '#DBEAFE', // Container primaire (bleu très clair)
          'on-primary-container': '#1E3A8A', // Texte sur container primaire
          'success-container': '#D1FAE5', // Container de succès (vert très clair)
          'on-success-container': '#059669', // Texte sur container de succès
          'warning-container': '#FEF3C7', // Container d'avertissement (jaune très clair)
          'on-warning-container': '#D97706', // Texte sur container d'avertissement
          'error-container': '#FEE2E2', // Container d'erreur (rouge très clair)
          'on-error-container': '#DC143C', // Texte sur container d'erreur

          // Variables spécifiques pour le calendrier
          'calendar-day-text': '#334155', // Texte des jours normaux
          'calendar-day-hover': '#3B82F6', // Couleur de survol des jours
          'calendar-today-bg': '#DBEAFE', // Arrière-plan du jour actuel

          // Variables pour les niveaux de difficulté
          'level-debutant': '#10B981', // Vert émeraude pour débutant
          'level-debutant-dark': '#059669', // Vert émeraude foncé pour dégradé
          'level-novice': '#3B82F6', // Bleu royal pour novice
          'level-novice-dark': '#2563EB', // Bleu royal foncé pour dégradé
          'level-intermediaire': '#F59E0B', // Orange pour intermédiaire
          'level-intermediaire-dark': '#D97706', // Orange foncé pour dégradé
          'level-avance': '#DC143C', // Rouge crimson pour avancé
          'level-avance-dark': '#B91C1C', // Rouge foncé pour dégradé
          'level-tous-niveaux': '#1E3A8A', // Bleu foncé pour tous niveaux
          'level-tous-niveaux-dark': '#1E40AF', // Bleu foncé pour dégradé
          'on-debutant': '#F8FAFC', // Très sombre pour le texte
          'on-novice': '#F8FAFC', // Très sombre pour le texte
          'on-intermediaire': '#F8FAFC', // Très sombre pour le texte
          'on-avance': '#F8FAFC', // Très sombre pour le texte
          'on-tous-niveaux': '#F8FAFC', // Très sombre pour le texte
        },
      },
      dark: {
        colors: {
          // Couleurs principales - Bleu foncé et gris bleu pour le mode sombre
          primary: '#3B82F6', // Bleu royal (plus clair pour le mode sombre)
          secondary: '#64748B', // Gris bleu (plus clair pour le mode sombre)
          accent: '#60A5FA', // Bleu clair (couleur d'accent)
          error: '#F87171', // Rouge corail (couleur d'erreur)
          info: '#38BDF8', // Bleu ciel (couleur d'information)
          success: '#34D399', // Vert émeraude (couleur de succès)
          warning: '#FBBF24', // Jaune (couleur d'avertissement)

          // Couleurs de surface - Gris bleu foncés
          background: '#0F172A', // Couleur de fond principale (gris très foncé avec teinte bleue)
          surface: '#1E293B', // Couleur de surface principale (gris foncé avec teinte bleue)
          'surface-variant': '#334155', // Variante de surface (gris bleu moyen)
          'surface-bright': '#1E293B', // Surface brillante (gris foncé avec teinte bleue)
          'surface-dim': '#0F172A', // Surface atténuée (gris très foncé avec teinte bleue)

          // Couleurs de texte
          'on-background': '#E2E8F0', // Texte sur fond (gris clair avec teinte bleue)
          'on-surface': '#E2E8F0', // Texte sur surface (gris clair avec teinte bleue)
          'on-surface-variant': '#CBD5E1', // Texte sur variante de surface (gris bleu clair)
          'text-primary': '#E2E8F0', // Texte principal (gris clair avec teinte bleue)
          'text-secondary': '#93C5FD', // Texte secondaire (bleu clair)
          'text-disabled': '#64748B', // Texte désactivé (gris bleu)

          // Couleurs primaires avec variations - Bleu pour le mode sombre
          'primary-base': '#3B82F6', // Couleur primaire de base
          'primary-darken-1': '#2563EB', // Couleur primaire plus foncée
          'primary-darken-2': '#1E40AF', // Couleur primaire encore plus foncée
          'primary-lighten-1': '#60A5FA', // Couleur primaire plus claire
          'primary-lighten-2': '#93C5FD', // Couleur primaire encore plus claire
          'primary-lighten-3': '#BFDBFE', // Couleur primaire très claire
          'primary-lighten-4': '#DBEAFE', // Couleur primaire ultra claire
          'primary-lighten-5': '#EFF6FF', // Couleur primaire la plus claire

          // Couleurs de succès avec variations
          'success-base': '#34D399', // Couleur de succès de base
          'success-lighten-4': '#6EE7B7', // Couleur de succès claire
          'success-lighten-5': '#A7F3D0', // Couleur de succès très claire

          // Couleurs d'erreur avec variations
          'error-base': '#FF5252', // Couleur d'erreur de base

          // Couleurs d'outline et ombres
          outline: '#475569', // Couleur de contour (gris bleu)
          'shadow-key-umbra-opacity': '0.3', // Opacité d'ombre (modérée)

          // Variables supplémentaires pour les containers
          'primary-container': '#1E3A8A', // Container primaire (bleu très foncé)
          'on-primary-container': '#DBEAFE', // Texte sur container primaire
          'success-container': '#064E3B', // Container de succès (vert foncé)
          'on-success-container': '#34D399', // Texte sur container de succès
          'warning-container': '#78350F', // Container d'avertissement (orange foncé)
          'on-warning-container': '#FBBF24', // Texte sur container d'avertissement
          'error-container': '#7F1D1D', // Container d'erreur (rouge foncé)
          'on-error-container': '#F87171', // Texte sur container d'erreur

          // Variables spécifiques pour le calendrier
          'calendar-day-text': '#E2E8F0', // Texte des jours normaux (plus clair)
          'calendar-day-hover': '#93C5FD', // Couleur de survol des jours
          'calendar-today-bg': '#1E3A8A', // Arrière-plan du jour actuel

          // Variables pour les niveaux de difficulté (mêmes couleurs que light)
          'level-debutant': '#10B981', // Vert émeraude pour débutant
          'level-debutant-dark': '#059669', // Vert émeraude foncé pour dégradé
          'level-novice': '#3B82F6', // Bleu royal pour novice
          'level-novice-dark': '#2563EB', // Bleu royal foncé pour dégradé
          'level-intermediaire': '#F59E0B', // Orange pour intermédiaire
          'level-intermediaire-dark': '#D97706', // Orange foncé pour dégradé
          'level-avance': '#DC143C', // Rouge crimson pour avancé
          'level-avance-dark': '#B91C1C', // Rouge foncé pour dégradé
          'level-tous-niveaux': '#1E3A8A', // Bleu foncé pour tous niveaux
          'level-tous-niveaux-dark': '#1E40AF', // Bleu foncé pour dégradé
          'on-debutant': '#0F172A', // Très sombre pour le texte
          'on-novice': '#0F172A', // Très sombre pour le texte
          'on-intermediaire': '#0F172A', // Très sombre pour le texte
          'on-avance': '#0F172A', // Très sombre pour le texte
          'on-tous-niveaux': '#F8FAFC', // Très clair pour le texte
        },
      },
    },
  },
})

export default vuetify
