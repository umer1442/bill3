"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Trash2, Save } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Invoice, InvoiceItem, Customer, Address } from "@/lib/types"
import {
  getCustomers,
  getCompanyDetails,
  addInvoice,
  updateInvoice,
  generateInvoiceNumber,
  numberToWords,
} from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"

interface InvoiceFormProps {
  invoice?: Invoice
  onSuccess?: () => void
}

const unitOptions = ["SQM", "SQF", "NOS", "PCS", "KGS"]
const countryOptions = ["India", "United States", "United Kingdom", "Canada", "Australia", "Other"]

export default function InvoiceForm({ invoice, onSuccess }: InvoiceFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerMode, setCustomerMode] = useState<"select" | "manual">("select")
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companyDetails, setCompanyDetails] = useState(getCompanyDetails())
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    placeOfSupply: "",
    reverseCharge: "N",
    grrrNumber: "",
    transport: "",
    vehicleNumber: "",
    station: "",
    eWayBillNumber: "",
    taxableAmount: 0,
    totalIgst: 0,
    roundedOff: 0,
    grandTotal: 0,
    amountInWords: "",
  })

  // Manual customer state
  const [manualCustomer, setManualCustomer] = useState<{
    name: string
    email: string
    phone: string
    pan: string
    gstin: string
  }>({
    name: "",
    email: "",
    phone: "",
    pan: "",
    gstin: "",
  })

  // Address state
  const [billingAddress, setBillingAddress] = useState<Address>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  })

  const [shippingAddress, setShippingAddress] = useState<Address>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  })

  const [useCustomerAddressForBilling, setUseCustomerAddressForBilling] = useState(true)
  const [useCustomerAddressForShipping, setUseCustomerAddressForShipping] = useState(true)
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true)

  useEffect(() => {
    // Load customers
    const customerData = getCustomers()
    setCustomers(customerData)

    // If editing an existing invoice
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        date: new Date(invoice.date).toISOString().split("T")[0],
        placeOfSupply: invoice.placeOfSupply,
        reverseCharge: invoice.reverseCharge,
        grrrNumber: invoice.grrrNumber,
        transport: invoice.transport,
        vehicleNumber: invoice.vehicleNumber,
        station: invoice.station,
        eWayBillNumber: invoice.eWayBillNumber,
        taxableAmount: invoice.taxableAmount,
        totalIgst: invoice.totalIgst,
        roundedOff: invoice.roundedOff,
        grandTotal: invoice.grandTotal,
        amountInWords: invoice.amountInWords,
      })
      setItems(invoice.items)

      // Set customer mode
      if (invoice.customer) {
        setCustomerMode("select")
        // Find the customer
        const customer = customerData.find((c) => c.id === invoice.customer?.id)
        if (customer) {
          setSelectedCustomer(customer)
        }
      } else if (invoice.manualCustomer) {
        setCustomerMode("manual")
        setManualCustomer({
          name: invoice.manualCustomer.name,
          email: invoice.manualCustomer.email || "",
          phone: invoice.manualCustomer.phone || "",
          pan: invoice.manualCustomer.pan,
          gstin: invoice.manualCustomer.gstin,
        })
      }

      // Set address data
      setBillingAddress(invoice.billingAddress)
      setShippingAddress(invoice.shippingAddress)
      setUseCustomerAddressForBilling(invoice.useCustomerAddressForBilling || false)
      setUseCustomerAddressForShipping(invoice.useCustomerAddressForShipping || false)
      setShippingSameAsBilling(invoice.shippingSameAsBilling || false)
    } else {
      // For new invoice, generate invoice number
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: generateInvoiceNumber(),
      }))

      // Add one empty item row
      addItemRow()
    }
  }, [invoice])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setSelectedCustomer(customer)

      // If using customer address for billing/shipping, update the addresses
      if (useCustomerAddressForBilling) {
        updateBillingAddressFromCustomer(customer)
      }

      if (useCustomerAddressForShipping && !shippingSameAsBilling) {
        updateShippingAddressFromCustomer(customer)
      } else if (useCustomerAddressForShipping && shippingSameAsBilling) {
        // If shipping is same as billing and using customer address, update shipping from billing
        updateShippingAddressFromBilling()
      }
    }
  }

  const handleManualCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setManualCustomer((prev) => ({ ...prev, [name]: value }))
  }

  const handleBillingAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBillingAddress((prev) => ({ ...prev, [name]: value }))

    // If shipping is same as billing, update shipping address too
    if (shippingSameAsBilling) {
      updateShippingAddressFromBilling()
    }
  }

  const handleShippingAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setShippingAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleBillingAddressSelectChange = (name: string, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [name]: value }))

    // If shipping is same as billing, update shipping address too
    if (shippingSameAsBilling) {
      setShippingAddress((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleShippingAddressSelectChange = (name: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [name]: value }))
  }

  const updateBillingAddressFromCustomer = (customer: Customer) => {
    setBillingAddress({
      addressLine1: customer.address,
      addressLine2: "",
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      country: customer.country || "India",
    })

    // If shipping is same as billing, update shipping address too
    if (shippingSameAsBilling) {
      updateShippingAddressFromBilling()
    }
  }

  const updateShippingAddressFromCustomer = (customer: Customer) => {
    setShippingAddress({
      addressLine1: customer.address,
      addressLine2: "",
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      country: customer.country || "India",
    })
  }

  const updateShippingAddressFromBilling = () => {
    setShippingAddress({ ...billingAddress })
  }

  const handleUseCustomerAddressForBillingChange = (checked: boolean) => {
    setUseCustomerAddressForBilling(checked)
    if (checked && selectedCustomer) {
      updateBillingAddressFromCustomer(selectedCustomer)
    }
  }

  const handleUseCustomerAddressForShippingChange = (checked: boolean) => {
    setUseCustomerAddressForShipping(checked)
    if (checked && selectedCustomer && !shippingSameAsBilling) {
      updateShippingAddressFromCustomer(selectedCustomer)
    } else if (checked && shippingSameAsBilling) {
      updateShippingAddressFromBilling()
    }
  }

  const handleShippingSameAsBillingChange = (checked: boolean) => {
    setShippingSameAsBilling(checked)
    if (checked) {
      updateShippingAddressFromBilling()
    }
  }

  const addItemRow = () => {
    const newItem: InvoiceItem = {
      id: uuidv4(),
      description: "",
      hsnCode: "",
      quantity: 0,
      unit: "Pcs",
      rate: 0,
      amount: 0,
      igstRate: 18,
      igstAmount: 0,
      total: 0,
    }
    setItems((prev) => [...prev, newItem])
  }

  const removeItemRow = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // Recalculate amounts if quantity or rate changes
          if (field === "quantity" || field === "rate") {
            const quantity = field === "quantity" ? Number(value) : item.quantity
            const rate = field === "rate" ? Number(value) : item.rate
            const amount = quantity * rate

            updatedItem.amount = amount
            updatedItem.igstAmount = amount * (updatedItem.igstRate / 100)
            updatedItem.total = amount + updatedItem.igstAmount
          }

          // Recalculate tax if tax rate changes
          if (field === "igstRate") {
            updatedItem.igstAmount = updatedItem.amount * (Number(value) / 100)
            updatedItem.total = updatedItem.amount + updatedItem.igstAmount
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  // Calculate totals whenever items change
  useEffect(() => {
    const taxableAmount = items.reduce((sum, item) => sum + item.amount, 0)
    const totalIgst = items.reduce((sum, item) => sum + item.igstAmount, 0)

    // Round to 2 decimal places
    const roundedTaxableAmount = Math.round(taxableAmount * 100) / 100
    const roundedTotalIgst = Math.round(totalIgst * 100) / 100

    // Calculate grand total (before rounding)
    const calculatedTotal = roundedTaxableAmount + roundedTotalIgst

    // Round to nearest whole number
    const roundedTotal = Math.round(calculatedTotal)

    // Calculate rounded off amount
    const roundedOff = roundedTotal - calculatedTotal

    setFormData((prev) => ({
      ...prev,
      taxableAmount: roundedTaxableAmount,
      totalIgst: roundedTotalIgst,
      roundedOff: Math.round(roundedOff * 100) / 100,
      grandTotal: roundedTotal,
      amountInWords: numberToWords(roundedTotal),
    }))
  }, [items])

  const validateForm = () => {
    // Check if items exist
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Items required",
        description: "Please add at least one item to the invoice",
      })
      return false
    }

    // Validate customer information
    if (customerMode === "select" && !selectedCustomer) {
      toast({
        variant: "destructive",
        title: "Customer required",
        description: "Please select a customer for this invoice",
      })
      return false
    }

    if (customerMode === "manual" && (!manualCustomer.name || !manualCustomer.pan || !manualCustomer.gstin)) {
      toast({
        variant: "destructive",
        title: "Customer information required",
        description: "Please fill in all required customer information",
      })
      return false
    }

    // Validate billing address
    if (
      !billingAddress.addressLine1 ||
      !billingAddress.city ||
      !billingAddress.state ||
      !billingAddress.pincode ||
      !billingAddress.country
    ) {
      toast({
        variant: "destructive",
        title: "Billing address required",
        description: "Please fill in all required billing address fields",
      })
      return false
    }

    // Validate shipping address if not same as billing
    if (
      !shippingSameAsBilling &&
      (!shippingAddress.addressLine1 ||
        !shippingAddress.city ||
        !shippingAddress.state ||
        !shippingAddress.pincode ||
        !shippingAddress.country)
    ) {
      toast({
        variant: "destructive",
        title: "Shipping address required",
        description: "Please fill in all required shipping address fields",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const invoiceData = {
        id: invoice?.id || uuidv4(), // Add an ID if it's a new invoice
        ...formData,
        customer: customerMode === "select" ? selectedCustomer : null,
        customerId: customerMode === "select" ? selectedCustomer?.id : undefined,
        manualCustomer: customerMode === "manual" ? {
          name: manualCustomer.name,
          email: manualCustomer.email || "",
          phone: manualCustomer.phone || "",
          pan: manualCustomer.pan,
          gstin: manualCustomer.gstin,
        } : undefined,
        billingAddress,
        shippingAddress: shippingSameAsBilling ? billingAddress : shippingAddress,
        useCustomerAddressForBilling,
        useCustomerAddressForShipping,
        shippingSameAsBilling,
        items,
        bankDetails: companyDetails.bankDetails,
        termsAndConditions: companyDetails.termsAndConditions,
      }

      if (invoice) {
        await updateInvoice(invoice.id, invoiceData)
        toast({
          title: "Success",
          description: "Invoice has been updated successfully",
        })
      } else {
        await addInvoice(invoiceData)
        toast({
          title: "Success",
          description: "Invoice has been created successfully",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/invoices")
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AuthError") {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Please log in again to continue.",
          })
          return
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to save invoice",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save invoice",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div className="flex-1">
              <h1 className="text-center text-2xl font-bold mb-4">TAX INVOICE</h1>
              <div>
                <h2 className="text-xl font-bold">{companyDetails.name}</h2>
                <p className="text-sm">{companyDetails.address}</p>
                <p className="text-sm">GSTIN: {companyDetails.gstin}</p>
                <p className="text-sm">PAN: {companyDetails.pan}</p>
                <p className="text-sm">Email: {companyDetails.email}</p>
                <p className="text-sm">Phone: {companyDetails.phone}</p>
                <p className="text-sm mt-2 font-arabic text-lg">محمد فیضان</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-24 h-24 relative mb-2">
                <Image src="/images/logo.png" alt="Company Logo" fill className="object-contain" />
              </div>
              <div className="text-xs border border-gray-300 px-2 py-1 rounded">Original Copy</div>
            </div>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice No.</Label>
                  <Input
                    id="invoiceNumber"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="placeOfSupply">Place of Supply</Label>
                  <Input
                    id="placeOfSupply"
                    name="placeOfSupply"
                    value={formData.placeOfSupply}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reverseCharge">Reverse Charge</Label>
                  <Select
                    value={formData.reverseCharge}
                    onValueChange={(value) => handleSelectChange("reverseCharge", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">Yes</SelectItem>
                      <SelectItem value="N">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grrrNumber">GR/RR No.</Label>
                <Input id="grrrNumber" name="grrrNumber" value={formData.grrrNumber} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transport">Transport</Label>
                  <Input id="transport" name="transport" value={formData.transport} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Vehicle No.</Label>
                  <Input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="station">Station</Label>
                  <Input id="station" name="station" value={formData.station} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eWayBillNumber">E-Way Bill No.</Label>
                  <Input
                    id="eWayBillNumber"
                    name="eWayBillNumber"
                    value={formData.eWayBillNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="my-6 border-t pt-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
              <RadioGroup
                value={customerMode}
                onValueChange={(value) => setCustomerMode(value as "select" | "manual")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="select" id="select-customer" />
                  <Label htmlFor="select-customer">Select Existing Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual-customer" />
                  <Label htmlFor="manual-customer">Enter Customer Details Manually</Label>
                </div>
              </RadioGroup>
            </div>

            {customerMode === "select" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customer">Select Customer</Label>
                  <Select value={selectedCustomer?.id || ""} onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCustomer && (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-semibold">Address:</span> {selectedCustomer.address}
                    </p>
                    <p>
                      <span className="font-semibold">City:</span> {selectedCustomer.city}, {selectedCustomer.state} -{" "}
                      {selectedCustomer.pincode}
                    </p>
                    <p>
                      <span className="font-semibold">GSTIN:</span> {selectedCustomer.gstin}
                    </p>
                    <p>
                      <span className="font-semibold">PAN:</span> {selectedCustomer.pan}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Customer Name</Label>
                  <Input
                    id="manual-name"
                    name="name"
                    value={manualCustomer.name}
                    onChange={handleManualCustomerChange}
                    required={customerMode === "manual"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-email">Email</Label>
                  <Input
                    id="manual-email"
                    name="email"
                    type="email"
                    value={manualCustomer.email}
                    onChange={handleManualCustomerChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-phone">Phone</Label>
                  <Input
                    id="manual-phone"
                    name="phone"
                    value={manualCustomer.phone}
                    onChange={handleManualCustomerChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-pan">PAN</Label>
                  <Input
                    id="manual-pan"
                    name="pan"
                    value={manualCustomer.pan}
                    onChange={handleManualCustomerChange}
                    required={customerMode === "manual"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-gstin">GSTIN</Label>
                  <Input
                    id="manual-gstin"
                    name="gstin"
                    value={manualCustomer.gstin}
                    onChange={handleManualCustomerChange}
                    required={customerMode === "manual"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Address Tabs */}
          <div className="my-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Address Information</h3>
            <Tabs defaultValue="billing" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="billing">Billing Address</TabsTrigger>
                <TabsTrigger value="shipping">Shipping Address</TabsTrigger>
              </TabsList>
              <TabsContent value="billing" className="space-y-4 pt-4">
                {customerMode === "select" && selectedCustomer && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="use-customer-address-billing"
                      checked={useCustomerAddressForBilling}
                      onCheckedChange={handleUseCustomerAddressForBillingChange}
                    />
                    <Label htmlFor="use-customer-address-billing">Use customer's address for billing</Label>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing-addressLine1">Address Line 1</Label>
                    <Input
                      id="billing-addressLine1"
                      name="addressLine1"
                      value={billingAddress.addressLine1}
                      onChange={handleBillingAddressChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-addressLine2">Address Line 2</Label>
                    <Input
                      id="billing-addressLine2"
                      name="addressLine2"
                      value={billingAddress.addressLine2}
                      onChange={handleBillingAddressChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-city">City</Label>
                    <Input
                      id="billing-city"
                      name="city"
                      value={billingAddress.city}
                      onChange={handleBillingAddressChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-state">State</Label>
                    <Input
                      id="billing-state"
                      name="state"
                      value={billingAddress.state}
                      onChange={handleBillingAddressChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-pincode">PIN Code</Label>
                    <Input
                      id="billing-pincode"
                      name="pincode"
                      value={billingAddress.pincode}
                      onChange={handleBillingAddressChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-country">Country</Label>
                    <Select
                      value={billingAddress.country}
                      onValueChange={(value) => handleBillingAddressSelectChange("country", value)}
                    >
                      <SelectTrigger id="billing-country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="space-y-4 pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="shipping-same-as-billing"
                    checked={shippingSameAsBilling}
                    onCheckedChange={handleShippingSameAsBillingChange}
                  />
                  <Label htmlFor="shipping-same-as-billing">Shipping address same as billing address</Label>
                </div>

                {!shippingSameAsBilling && (
                  <>
                    {customerMode === "select" && selectedCustomer && (
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                          id="use-customer-address-shipping"
                          checked={useCustomerAddressForShipping}
                          onCheckedChange={handleUseCustomerAddressForShippingChange}
                          disabled={shippingSameAsBilling}
                        />
                        <Label htmlFor="use-customer-address-shipping">Use customer's address for shipping</Label>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shipping-addressLine1">Address Line 1</Label>
                        <Input
                          id="shipping-addressLine1"
                          name="addressLine1"
                          value={shippingAddress.addressLine1}
                          onChange={handleShippingAddressChange}
                          required={!shippingSameAsBilling}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shipping-addressLine2">Address Line 2</Label>
                        <Input
                          id="shipping-addressLine2"
                          name="addressLine2"
                          value={shippingAddress.addressLine2}
                          onChange={handleShippingAddressChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shipping-city">City</Label>
                        <Input
                          id="shipping-city"
                          name="city"
                          value={shippingAddress.city}
                          onChange={handleShippingAddressChange}
                          required={!shippingSameAsBilling}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shipping-state">State</Label>
                        <Input
                          id="shipping-state"
                          name="state"
                          value={shippingAddress.state}
                          onChange={handleShippingAddressChange}
                          required={!shippingSameAsBilling}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shipping-pincode">PIN Code</Label>
                        <Input
                          id="shipping-pincode"
                          name="pincode"
                          value={shippingAddress.pincode}
                          onChange={handleShippingAddressChange}
                          required={!shippingSameAsBilling}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shipping-country">Country</Label>
                        <Select
                          value={shippingAddress.country}
                          onValueChange={(value) => handleShippingAddressSelectChange("country", value)}
                        >
                          <SelectTrigger id="shipping-country">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Invoice Items */}
          <div className="my-6 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border bg-black">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="p-3 text-left w-12">S.N.</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-left w-24">HSN/SAC</th>
                    <th className="p-3 text-right w-24">Qty</th>
                    <th className="p-3 text-left w-24">Unit</th>
                    <th className="p-3 text-right w-28">Rate</th>
                    <th className="p-3 text-right w-28">Amount</th>
                    <th className="p-3 text-right w-24">IGST %</th>
                    <th className="p-3 text-right w-28">IGST Amt</th>
                    <th className="p-3 text-right w-28">Total</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-900">
                      <td className="p-3 text-center">{index + 1}</td>
                      <td className="p-3">
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                          className="w-full bg-transparent"
                          required
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={item.hsnCode}
                          onChange={(e) => handleItemChange(item.id, "hsnCode", e.target.value)}
                          className="w-full bg-transparent text-center"
                          required
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                          className="w-full bg-transparent text-right number-input-no-spinners"
                          min="0"
                          step="1"
                          required
                        />
                      </td>
                      <td className="p-3">
                        <Select value={item.unit} onValueChange={(value) => handleItemChange(item.id, "unit", value)}>
                          <SelectTrigger className="w-full bg-transparent">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) => handleItemChange(item.id, "rate", Number(e.target.value))}
                          className="w-full bg-transparent text-right number-input-no-spinners"
                          min="0"
                          step="0.01"
                          required
                        />
                      </td>
                      <td className="p-3 text-right font-medium">₹{item.amount.toFixed(2)}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={item.igstRate === 0 ? "0" : item.igstRate || ""}
                          onChange={(e) => handleItemChange(item.id, "igstRate", Number(e.target.value))}
                          className="w-full bg-transparent text-right number-input-no-spinners"
                          min="0"
                          max="100"
                          step="0.01"
                          required
                        />
                      </td>
                      <td className="p-3 text-right font-medium">₹{item.igstAmount.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold">₹{item.total.toFixed(2)}</td>
                      <td className="p-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemRow(item.id)}
                          disabled={items.length <= 1}
                          className="hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="flex justify-end my-6">
            <div className="w-full md:w-1/2 lg:w-1/3">
              <div className="grid grid-cols-2 gap-2">
                <p className="font-semibold text-right">Taxable Amount:</p>
                <p className="text-right">₹{formData.taxableAmount.toFixed(2)}</p>
                <p className="font-semibold text-right">Total IGST:</p>
                <p className="text-right">₹{formData.totalIgst.toFixed(2)}</p>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="roundedOff">Rounded Off:</Label>
                  <Input
                    id="roundedOff"
                    name="roundedOff"
                    type="number"
                    step="0.01"
                    value={formData.roundedOff}
                    onChange={handleChange}
                    className="text-right"
                  />
                </div>
                <p className="font-semibold text-right border-t pt-1">Grand Total:</p>
                <p className="text-right font-bold border-t pt-1">₹{formData.grandTotal.toFixed(2)}</p>
              </div>
              <p className="text-sm mt-2 italic">{formData.amountInWords}</p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="mt-6 border-t pt-4">
            <h3 className="font-bold mb-2">Bank Details:</h3>
            <div className="text-sm">
              <p>Bank Name: {companyDetails.bankDetails.bankName}</p>
              <p>Branch: {companyDetails.bankDetails.branch}</p>
              <p>Account No.: {companyDetails.bankDetails.accountNumber}</p>
              <p>IFSC Code: {companyDetails.bankDetails.ifscCode}</p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mt-6 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms & Conditions:</Label>
              <Textarea id="termsAndConditions" value={companyDetails.termsAndConditions} readOnly rows={3} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : invoice ? "Update Invoice" : "Generate Invoice"}
        </Button>
      </div>
    </form>
  )
}
