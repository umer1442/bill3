"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import InvoiceForm from "@/components/invoice-form"
import { initializeData } from "@/lib/data-service"

export default function NewInvoicePage() {
  const router = useRouter()

  useEffect(() => {
    initializeData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Invoice</h2>
        <p className="text-muted-foreground">Fill in the details to generate a new invoice</p>
      </div>

      <InvoiceForm
        onSuccess={() => {
          router.push("/invoices")
        }}
      />
    </div>
  )
}
