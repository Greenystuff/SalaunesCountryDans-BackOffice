// Types partagés pour l'application

export interface Payment {
  _id?: string
  amount: number
  paymentMethod: 'chèque' | 'Espèce' | 'Virement' | 'Carte bancaire'
  purpose: string
  description?: string
  paymentDate: string
  chequeId?: string
  cheque?: {
    _id: string
    checkNumber?: string
    bankName?: string
    amount: number
    status: string
  }
}

export interface Member {
  _id: string
  firstName: string
  lastName: string
  birthDate: string
  address: string
  postalCode: string
  city: string
  homePhone?: string
  mobilePhone?: string
  email: string
  imageRights: boolean
  enrolledEvents: any[]
  registrationDate?: string
  checkDeposits?: Array<{ amount: number; depositDate: string }>
  age?: number
  primaryPhone?: string
  status?: 'pré-inscrit' | 'inscrit' | 'actif' | 'inactif'
  intendedTrialDate?: string
}

export interface Course {
  _id: string
  title: string
  level: string
}

export interface Stats {
  totalMembers: number
  membersWithImageRights: number
  membersByCity: Array<{ _id: string; count: number }>
  ageDistribution: Array<{ _id: string; count: number }>
}

export interface InternalRules {
  _id: string
  title: string
  version: string
  description?: string
  pdfFile: string
  fileSize: number
  uploadDate: string
  isActive: boolean
  uploadedBy?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  pdfUrl?: string
}
