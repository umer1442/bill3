"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil, Trash2, Printer } from "lucide-react"
import type { Invoice } from "@/lib/types"
import { getInvoices, deleteInvoice, initializeData } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const loadInvoices = () => {
    try {
      const data = getInvoices()
      setInvoices(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invoices"
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await initializeData()
        loadInvoices()
      } catch (error) {
        if (error instanceof Error && error.name === "AuthError") {
          router.push("/login")
          return
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load invoices",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router, toast])

  const handleAddInvoice = () => {
    router.push("/invoices/new")
  }

  const handleEditInvoice = (invoice: Invoice) => {
    router.push(`/invoices/edit/${invoice.id}`)
  }

  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedInvoice) return
    
    try {
      const success = deleteInvoice(selectedInvoice.id)
      if (success) {
        toast({
          title: "Invoice deleted",
          description: "Invoice has been deleted successfully",
        })
        loadInvoices()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete invoice",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invoice",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedInvoice(null)
    }
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    router.push(`/invoices/print/${invoice.id}`)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd-MM-yyyy")
    } catch (error) {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage your invoices</p>
        </div>
        <Button onClick={handleAddInvoice}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 border rounded-lg border-dashed p-8">
          <h3 className="text-lg font-medium">No invoices found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first invoice</p>
          <Button onClick={handleAddInvoice}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>
                    {invoice.customer ? invoice.customer.name : invoice.manualCustomer?.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-right">₹{invoice.grandTotal.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrintInvoice(invoice)}
                        title="Print Invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditInvoice(invoice)}
                        title="Edit Invoice"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(invoice)}
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Invoice #{selectedInvoice?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
