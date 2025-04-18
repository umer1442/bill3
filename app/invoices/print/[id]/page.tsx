"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getInvoiceById, getCompanyDetails, initializeData } from "@/lib/data-service"
import type { Invoice, CompanyDetails } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, FileDown } from "lucide-react"
import Image from "next/image"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { format } from "date-fns"

import React from "react"

export default function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const id = React.use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    initializeData()
    loadData()
  }, [])

  const loadData = () => {
    setIsLoading(true)
    const invoiceData = getInvoiceById(id.id)
    const companyData = getCompanyDetails()

    if (!invoiceData) {
      toast({
        variant: "destructive",
        title: "Invoice not found",
        description: "The requested invoice could not be found",
      })
      router.push("/invoices")
      return
    }

    setInvoice(invoiceData)
    setCompanyDetails(companyData)
    setIsLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return

    setIsPrinting(true)

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`Invoice_${invoice?.invoiceNumber}.pdf`)

      toast({
        title: "PDF Exported",
        description: "Invoice has been exported as PDF",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export invoice as PDF",
      })
      console.error(error)
    } finally {
      setIsPrinting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd-MM-yyyy")
    } catch (error) {
      return dateString
    }
  }

  const formatAddress = (address: any) => {
    if (!address) return ""

    const parts = [
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} - ${address.pincode}`,
      address.country !== "India" ? address.country : "",
    ].filter(Boolean)

    return parts.join(", ")
  }

  const getCustomerName = () => {
    if (invoice?.customer) {
      return invoice.customer.name
    } else if (invoice?.manualCustomer) {
      return invoice.manualCustomer.name
    }
    return ""
  }

  const getCustomerPAN = () => {
    if (invoice?.customer) {
      return invoice.customer.pan
    } else if (invoice?.manualCustomer) {
      return invoice.manualCustomer.pan
    }
    return ""
  }

  const getCustomerGSTIN = () => {
    if (invoice?.customer) {
      return invoice.customer.gstin
    } else if (invoice?.manualCustomer) {
      return invoice.manualCustomer.gstin
    }
    return ""
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading invoice...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleExportPDF} disabled={isPrinting}>
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {invoice && companyDetails && (
        <div ref={invoiceRef} className="bg-white text-gray-900 p-8 rounded-lg border shadow-sm max-w-5xl mx-auto min-h-[29.7cm] text-sm">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div className="flex-1">
              <h1 className="text-center text-2xl font-bold mb-4">TAX INVOICE</h1>
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold">{companyDetails.name}</h2>
                <p className="text-sm">{companyDetails.address}</p>
                <p className="text-sm">GSTIN: {companyDetails.gstin}</p>
                <p className="text-sm">PAN: {companyDetails.pan}</p>
                <p className="text-sm">Email: {companyDetails.email}</p>
                <p className="text-sm">Phone: {companyDetails.phone}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-24 h-24 relative mb-2">
                <Image src="/images/logo.png" alt="Company Logo" fill className="object-contain" priority />
              </div>
              <div className="text-xs border border-gray-300 px-2 py-1 rounded">Original Copy</div>
            </div>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-2 gap-6 my-4">
            <div>
              <div className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                <p className="font-semibold">Invoice No.:</p>
                <p>{invoice.invoiceNumber}</p>
                <p className="font-semibold">Date:</p>
                <p>{formatDate(invoice.date)}</p>
                <p className="font-semibold">Place of Supply:</p>
                <p>{invoice.placeOfSupply}</p>
                <p className="font-semibold">Reverse Charge:</p>
                <p>{invoice.reverseCharge}</p>
                <p className="font-semibold">GR/RR No.:</p>
                <p>{invoice.grrrNumber || "-"}</p>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                <p className="font-semibold">Transport:</p>
                <p>{invoice.transport || "-"}</p>
                <p className="font-semibold">Vehicle No.:</p>
                <p>{invoice.vehicleNumber || "-"}</p>
                <p className="font-semibold">Station:</p>
                <p>{invoice.station || "-"}</p>
                <p className="font-semibold">E-Way Bill No.:</p>
                <p>{invoice.eWayBillNumber || "-"}</p>
              </div>
            </div>
          </div>

          {/* Billing and Shipping */}
          <div className="grid grid-cols-2 gap-6 my-4 border-t border-b py-3">
            <div className="space-y-1">
              <h3 className="font-bold text-base mb-2">Billed to:</h3>
              <p className="font-semibold">{getCustomerName()}</p>
              <p className="text-sm leading-relaxed">{formatAddress(invoice.billingAddress)}</p>
              <p className="text-sm">PAN: {getCustomerPAN()}</p>
              <p className="text-sm">GSTIN: {getCustomerGSTIN()}</p>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base mb-2">Shipped to:</h3>
              <p className="font-semibold">{getCustomerName()}</p>
              <p className="text-sm leading-relaxed">{formatAddress(invoice.shippingAddress || invoice.billingAddress)}</p>
              <p className="text-sm">PAN: {getCustomerPAN()}</p>
              <p className="text-sm">GSTIN: {getCustomerGSTIN()}</p>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left w-10">S.N.</th>
                  <th className="border p-2 text-left">Description</th>
                  <th className="border p-2 text-left w-20">HSN/SAC</th>
                  <th className="border p-2 text-right w-16">Qty</th>
                  <th className="border p-2 text-left w-16">Unit</th>
                  <th className="border p-2 text-right w-20">Rate</th>
                  <th className="border p-2 text-right w-24">Amount</th>
                  <th className="border p-2 text-right w-16">IGST %</th>
                  <th className="border p-2 text-right w-20">IGST Amt</th>
                  <th className="border p-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">{index + 1}</td>
                    <td className="border p-2">{item.description}</td>
                    <td className="border p-2">{item.hsnCode}</td>
                    <td className="border p-2 text-right">{item.quantity}</td>
                    <td className="border p-2">{item.unit}</td>
                    <td className="border p-2 text-right">{item.rate.toFixed(2)}</td>
                    <td className="border p-2 text-right">{item.amount.toFixed(2)}</td>
                    <td className="border p-2 text-right">{item.igstRate.toFixed(2)}%</td>
                    <td className="border p-2 text-right">{item.igstAmount.toFixed(2)}</td>
                    <td className="border p-2 text-right font-medium">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={6} className="border p-2 text-right font-semibold">Total:</td>
                  <td className="border p-2 text-right font-semibold">
                    {invoice.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                  </td>
                  <td className="border p-2"></td>
                  <td className="border p-2 text-right font-semibold">
                    {invoice.items.reduce((sum, item) => sum + item.igstAmount, 0).toFixed(2)}
                  </td>
                  <td className="border p-2 text-right font-semibold">
                    {invoice.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Invoice Summary */}
          <div className="flex justify-end my-4">
            <div className="w-1/2">
              <div className="grid grid-cols-2 gap-1 text-sm">
                <p className="font-semibold text-right py-1">Taxable Amount:</p>
                <p className="text-right py-1">₹{invoice.taxableAmount.toFixed(2)}</p>
                <p className="font-semibold text-right py-1">Total IGST:</p>
                <p className="text-right py-1">₹{invoice.totalIgst.toFixed(2)}</p>
                <p className="font-semibold text-right py-1">Rounded Off:</p>
                <p className="text-right py-1">₹{invoice.roundedOff.toFixed(2)}</p>
                <p className="font-semibold text-right border-t py-1">Grand Total:</p>
                <p className="text-right font-bold border-t py-1">₹{invoice.grandTotal.toFixed(2)}</p>
              </div>
              <p className="text-xs mt-2 italic">{invoice.amountInWords}</p>
            </div>
          </div>

          {/* Bank Details */}
          <div className="mt-6 border-t pt-3 print:block text-sm">
            <h3 className="font-bold text-base mb-2">Bank Details:</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
              <p><span className="font-medium">Bank Name:</span> {companyDetails.bankDetails.bankName}</p>
              <p><span className="font-medium">Branch:</span> {companyDetails.bankDetails.branch}</p>
              <p><span className="font-medium">Account No.:</span> {companyDetails.bankDetails.accountNumber}</p>
              <p><span className="font-medium">IFSC Code:</span> {companyDetails.bankDetails.ifscCode}</p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-6 border-t pt-3">
            <div className="text-sm">
              For A1 Glass Enterprises
              <p className="mt-2">Authorised Signatory</p>
              <p>All disputes are subject to Bijnor jurisdiction only.</p>
              <p>Goods once sold will not be taken back.</p>
              <p>E.& O.E.</p>
            </div>
          </div>

          {/* QR Code and Signature */}
          <div className="mt-6 grid grid-cols-2 gap-6 pt-3 border-t">
            <div>
              <p className="font-bold text-base mb-2">E-Invoice QR Code</p>
              {invoice.qrCode && (
                <div className="w-24 h-24 border p-1">
                  <Image src={invoice.qrCode} alt="QR Code" width={90} height={90} className="object-contain" />
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="mb-12 text-sm">For A1 Glass Enterprises</p>
              <p className="font-bold border-t pt-1 w-40 ml-auto text-sm">Authorised Signatory</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
