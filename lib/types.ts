export interface Address {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface Customer {
  id: string
  name: string
  address: string
  city: string
  state: string
  pincode: string
  pan: string
  gstin: string
  email?: string
  phone?: string
  country?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  hsnCode: string
  quantity: number
  unit: string
  rate: number
  amount: number
  igstRate: number
  igstAmount: number
  total: number
}

export interface Invoice {
  id: string
  userId: string // Add this line to track which user created the invoice
  invoiceNumber: string
  date: string
  placeOfSupply: string
  reverseCharge: string
  grrrNumber: string
  transport: string
  vehicleNumber: string
  station: string
  eWayBillNumber: string
  customer: Customer | null
  customerId?: string
  manualCustomer?: {
    name: string
    email?: string
    phone?: string
    pan: string
    gstin: string
  }
  billingAddress: Address
  shippingAddress: Address
  useCustomerAddressForBilling: boolean
  useCustomerAddressForShipping: boolean
  shippingSameAsBilling: boolean
  items: InvoiceItem[]
  taxableAmount: number
  totalIgst: number
  roundedOff: number
  grandTotal: number
  amountInWords: string
  bankDetails: {
    bankName: string
    branch: string
    accountNumber: string
    ifscCode: string
  }
  termsAndConditions: string
  qrCode?: string
  createdAt: string
  updatedAt: string
}

export interface CompanyDetails {
  name: string
  address: string
  gstin: string
  pan: string
  email: string
  phone: string
  bankDetails: {
    bankName: string
    branch: string
    accountNumber: string
    ifscCode: string
  }
  termsAndConditions: string
}
