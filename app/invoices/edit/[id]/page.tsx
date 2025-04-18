"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import InvoiceForm from "@/components/invoice-form"
import { getInvoiceById, initializeData } from "@/lib/data-service"
import type { Invoice } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    initializeData()
    loadInvoice()
  }, [])

  const loadInvoice = () => {
    setIsLoading(true)
    const invoiceData = getInvoiceById(params.id)

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
    setIsLoading(false)
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Invoice</h2>
        <p className="text-muted-foreground">Update invoice #{invoice?.invoiceNumber}</p>
      </div>

      {invoice && (
        <InvoiceForm
          invoice={invoice}
          onSuccess={() => {
            router.push("/invoices")
          }}
        />
      )}
    </div>
  )
}
