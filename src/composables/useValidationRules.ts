import { reactive } from 'vue'

export function useValidationRules() {
  const rules = reactive({
    required: (v: string) => !!v || 'Ce champ est requis',
    email: (v: string) => {
      const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return pattern.test(v) || "L'email n'est pas valide"
    },
    minLength: (v: string) => (v && v.length >= 8) || 'Minimum 8 caractères',
    phoneFormat: (v: string) => !v || /^(\+33|0)[1-9](\d{8})$/.test(v) || 'Format de téléphone invalide'
  })

  return { rules }
}
