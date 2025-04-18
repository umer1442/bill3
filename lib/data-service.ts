import type { Customer, Invoice, CompanyDetails, Address } from "./types"
import { v4 as uuidv4 } from "uuid"

class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthError"
  }
}

// Default company details
const defaultCompanyDetails: CompanyDetails = {
  name: "A1 Glass Enterprises",
  address: "Village Shahbajpur Khana, Ganj Tiraha, Bijnor, Uttar Pradesh-246701",
  gstin: "09ABZPF7974Q1Z7",
  pan: "ABZPF7974Q",
  email: "a1glass@example.com",
  phone: "8490843958, 7819956006",
  bankDetails: {
    bankName: "State Bank of India",
    branch: "Bijnor",
    accountNumber: "38346013970",
    ifscCode: "SBIN0016759",
  },
  termsAndConditions: `1. All disputes are subject to Bijnor jurisdiction only.
2. Goods once sold will not be taken back.
3. E.& O.E.
4. Payment should be made by NEFT/RTGS/IMPS only.
5. Any discrepancy in the invoice should be notified within 24 hours of receipt.`,
}

// Default address
const defaultAddress: Address = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
}

// Error handler wrapper for data operations
const withAuthCheck = <T>(operation: () => T): T => {
  try {
    return operation()
  } catch (error) {
    if (error instanceof AuthError) {
      // Only clear auth state, not user data
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("currentUser")
      
      // Only redirect if we're in a browser context
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    throw error
  }
}

// Get current user from localStorage with error handling
const getCurrentUser = () => {
  if (typeof window === "undefined") return null
  const userJson = localStorage.getItem("currentUser")
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
  
  if (!isLoggedIn || !userJson) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      throw new AuthError("User not authenticated")
    }
    return null
  }
  
  return JSON.parse(userJson)
}

// Initialize localStorage with default data if empty
export const initializeData = () => {
  if (typeof window === "undefined") return

  try {
    const currentUser = getCurrentUser()
    // Only initialize data if user is authenticated
    if (currentUser) {
      // Initialize company details if not exists
      if (!localStorage.getItem("companyDetails")) {
        localStorage.setItem("companyDetails", JSON.stringify(defaultCompanyDetails))
      }
    }
  } catch (error) {
    // If auth error occurs, let it be handled by the auth check wrapper
    if (error instanceof AuthError) {
      throw error
    }
    // For other errors, log but don't clear data
    console.error("Error initializing data:", error)
  }
}

// Customer CRUD operations with auth protection
export const getCustomers = (): Customer[] => {
  return withAuthCheck(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) return []
    
    const customers = localStorage.getItem(`customers_${currentUser.id}`)
    return customers ? JSON.parse(customers) : []
  })
}

export const getCustomerById = (id: string): Customer | undefined => {
  const customers = getCustomers()
  return customers.find((customer) => customer.id === id)
}

export const addCustomer = (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Customer => {
  return withAuthCheck(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) throw new AuthError("User not authenticated")

    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const customers = getCustomers()
    customers.push(newCustomer)
    localStorage.setItem(`customers_${currentUser.id}`, JSON.stringify(customers))

    return newCustomer
  })
}

export const updateCustomer = (id: string, customerData: Partial<Customer>): Customer | undefined => {
  return withAuthCheck(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) throw new AuthError("User not authenticated")

    const customers = getCustomers()
    const index = customers.findIndex((customer) => customer.id === id)

    if (index === -1) return undefined

    const updatedCustomer = {
      ...customers[index],
      ...customerData,
      updatedAt: new Date().toISOString(),
    }

    customers[index] = updatedCustomer
    localStorage.setItem(`customers_${currentUser.id}`, JSON.stringify(customers))

    return updatedCustomer
  })
}

export const deleteCustomer = (id: string): boolean => {
  return withAuthCheck(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) return false

    const customers = getCustomers()
    const filteredCustomers = customers.filter((customer) => customer.id !== id)

    if (filteredCustomers.length === customers.length) return false

    localStorage.setItem(`customers_${currentUser.id}`, JSON.stringify(filteredCustomers))
    return true
  })
}

// Invoice CRUD operations with auth protection
export const getInvoices = (): Invoice[] => {
  return withAuthCheck(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) return []

    const invoices = localStorage.getItem(`invoices_${currentUser.id}`)
    return invoices ? JSON.parse(invoices) : []
  })
}

export const getInvoiceById = (id: string): Invoice | undefined => {
  return withAuthCheck(() => {
    const invoices = getInvoices()
    return invoices.find((invoice) => invoice.id === id)
  })
}

export const addInvoice = (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt" | "userId">): Invoice => {
  return withAuthCheck(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) throw new AuthError("User not authenticated")

    // Ensure addresses are set
    const billingAddress = invoice.billingAddress || defaultAddress
    const shippingAddress = invoice.shippingSameAsBilling ? billingAddress : invoice.shippingAddress || defaultAddress

    const newInvoice: Invoice = {
      ...invoice,
      billingAddress,
      shippingAddress,
      id: uuidv4(),
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const invoices = getInvoices()
    invoices.push(newInvoice)
    localStorage.setItem(`invoices_${currentUser.id}`, JSON.stringify(invoices))

    return newInvoice
  })
}

export const updateInvoice = (id: string, invoiceData: Partial<Invoice>): Invoice | undefined => {
  return withAuthCheck(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) throw new AuthError("User not authenticated")

    const invoices = getInvoices()
    const index = invoices.findIndex((invoice) => invoice.id === id)

    if (index === -1) return undefined

    // Verify ownership
    if (invoices[index].userId !== currentUser.id) {
      throw new AuthError("Not authorized to modify this invoice")
    }

    // Ensure addresses are set
    const billingAddress = invoiceData.billingAddress || invoices[index].billingAddress || defaultAddress
    const shippingAddress = invoiceData.shippingSameAsBilling
      ? billingAddress
      : invoiceData.shippingAddress || invoices[index].shippingAddress || defaultAddress

    const updatedInvoice = {
      ...invoices[index],
      ...invoiceData,
      billingAddress,
      shippingAddress,
      updatedAt: new Date().toISOString(),
    }

    invoices[index] = updatedInvoice
    localStorage.setItem(`invoices_${currentUser.id}`, JSON.stringify(invoices))

    return updatedInvoice
  })
}

export const deleteInvoice = (id: string): boolean => {
  return withAuthCheck(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) return false

    const invoices = getInvoices()
    
    // Verify ownership before deletion
    const invoice = invoices.find(inv => inv.id === id)
    if (!invoice || invoice.userId !== currentUser.id) {
      throw new AuthError("Not authorized to delete this invoice")
    }

    const filteredInvoices = invoices.filter((invoice) => invoice.id !== id)

    if (filteredInvoices.length === invoices.length) return false

    localStorage.setItem(`invoices_${currentUser.id}`, JSON.stringify(filteredInvoices))
    return true
  })
}

// Company details operations
export const getCompanyDetails = (): CompanyDetails => {
  if (typeof window === "undefined") return defaultCompanyDetails
  const details = localStorage.getItem("companyDetails")
  return details ? JSON.parse(details) : defaultCompanyDetails
}

export const updateCompanyDetails = (details: Partial<CompanyDetails>): CompanyDetails => {
  const currentDetails = getCompanyDetails()
  const updatedDetails = { ...currentDetails, ...details }

  localStorage.setItem("companyDetails", JSON.stringify(updatedDetails))
  return updatedDetails
}

// Generate invoice number
export const generateInvoiceNumber = (): string => {
  const invoices = getInvoices()
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  // Format: INV-YYYYMM-XXX where XXX is sequential
  const prefix = `INV-${year}${month}-`

  // Find the highest number with the same prefix
  const regex = new RegExp(`^${prefix}(\\d+)`)
  let maxNumber = 0

  invoices.forEach((invoice) => {
    const match = invoice.invoiceNumber.match(regex)
    if (match) {
      const num = Number.parseInt(match[1])
      if (num > maxNumber) maxNumber = num
    }
  })

  // Increment and pad with zeros
  const nextNumber = String(maxNumber + 1).padStart(3, "0")
  return `${prefix}${nextNumber}`
}

// Convert number to words for invoice
export const numberToWords = (num: number): string => {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  const convertLessThanOneThousand = (num: number): string => {
    if (num === 0) return ""

    if (num < 20) return units[num]

    const ten = Math.floor(num / 10) % 10
    const unit = num % 10

    return ten > 0 ? tens[ten] + (unit > 0 ? " " + units[unit] : "") : units[unit]
  }

  if (num === 0) return "Zero"

  // Handle negative numbers
  const negative = num < 0
  num = Math.abs(num)

  // Split into rupees and paise
  const rupees = Math.floor(num)
  const paise = Math.round((num - rupees) * 100)

  let result = ""

  if (rupees > 0) {
    const crores = Math.floor(rupees / 10000000)
    const lakhs = Math.floor((rupees % 10000000) / 100000)
    const thousands = Math.floor((rupees % 100000) / 1000)
    const hundreds = Math.floor((rupees % 1000) / 100)
    const remainder = rupees % 100

    if (crores > 0) {
      result += convertLessThanOneThousand(crores) + " Crore "
    }

    if (lakhs > 0) {
      result += convertLessThanOneThousand(lakhs) + " Lakh "
    }

    if (thousands > 0) {
      result += convertLessThanOneThousand(thousands) + " Thousand "
    }

    if (hundreds > 0) {
      result += convertLessThanOneThousand(hundreds) + " Hundred "
    }

    if (remainder > 0) {
      if (result !== "") result += "and "
      result += convertLessThanOneThousand(remainder)
    }

    result += " Rupees"
  }

  if (paise > 0) {
    if (result !== "") result += " and "
    result += convertLessThanOneThousand(paise) + " Paise"
  }

  if (negative) result = "Negative " + result

  return result + " Only"
}
