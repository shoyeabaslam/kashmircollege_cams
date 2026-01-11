import { Role, StudentStatus, VerificationStatus } from '@prisma/client'

export type { Role, StudentStatus, VerificationStatus }

export interface StudentFormData {
  name: string
  email: string
  phone: string
  address: string
  academicDetails: {
    degree?: string
    institution?: string
    yearOfPassing?: string
    percentage?: number
  }
}

export interface CertificateUpload {
  studentId: string
  documentType: string
  file: File
}

export interface FeeTransactionData {
  studentId: string
  feeHeadId: string
  amount: number
  paymentDate: Date
}

export interface PrincipalRemarkData {
  date: Date
  remark: string
}

