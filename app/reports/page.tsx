"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getInvoices, getCustomers, initializeData } from "@/lib/data-service"
import type { Invoice, Customer } from "@/lib/types"
import { BarChart, LineChart } from "@/components/charts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeData()
    loadData()
  }, [])

  const loadData = () => {
    setIsLoading(true)
    const invoiceData = getInvoices()
    const customerData = getCustomers()
    setInvoices(invoiceData)
    setCustomers(customerData)
    setIsLoading(false)
  }

  // Prepare monthly sales data
  const prepareMonthlySalesData = () => {
    const monthlyData: Record<string, number> = {}

    invoices.forEach((invoice) => {
      const date = new Date(invoice.date)
      const monthYear = format(date, "MMM yyyy")

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0
      }

      monthlyData[monthYear] += invoice.grandTotal
    })

    return Object.entries(monthlyData)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => {
        const dateA = new Date(a.name)
        const dateB = new Date(b.name)
        return dateA.getTime() - dateB.getTime()
      })
  }

  // Prepare customer-wise data
  const prepareCustomerWiseData = () => {
    const customerData: Record<string, number> = {}

    invoices.forEach((invoice) => {
      const customerName = invoice.customer ? invoice.customer.name : invoice.manualCustomer?.name || "Unknown Customer"

      if (!customerData[customerName]) {
        customerData[customerName] = 0
      }

      customerData[customerName] += invoice.grandTotal
    })

    return Object.entries(customerData)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }

  // Prepare tax breakdown data
  const prepareTaxBreakdownData = () => {
    const taxData: Record<string, { taxable: number; tax: number }> = {}

    invoices.forEach((invoice) => {
      const date = new Date(invoice.date)
      const monthYear = format(date, "MMM yyyy")

      if (!taxData[monthYear]) {
        taxData[monthYear] = { taxable: 0, tax: 0 }
      }

      taxData[monthYear].taxable += invoice.taxableAmount
      taxData[monthYear].tax += invoice.totalIgst
    })

    return Object.entries(taxData)
      .map(([month, data]) => ({
        month,
        taxable: data.taxable,
        tax: data.tax,
        percentage: data.taxable > 0 ? (data.tax / data.taxable) * 100 : 0,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
  }

  const monthlySalesData = prepareMonthlySalesData()
  const customerWiseData = prepareCustomerWiseData()
  const taxBreakdownData = prepareTaxBreakdownData()

  const handleExportCSV = (data: any[], filename: string) => {
    // Create CSV content
    const headers = Object.keys(data[0] || {})
    const csvRows = [headers.join(",")]

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header]
        return typeof value === "string" ? `"${value}"` : value
      })
      csvRows.push(values.join(","))
    })

    const csvContent = csvRows.join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">View and export reports based on your invoice data</p>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 border rounded-lg border-dashed p-8">
          <h3 className="text-lg font-medium">No data available</h3>
          <p className="text-muted-foreground mb-4">Create some invoices to generate reports</p>
        </div>
      ) : (
        <Tabs defaultValue="monthly">
          <TabsList>
            <TabsTrigger value="monthly">Monthly Sales</TabsTrigger>
            <TabsTrigger value="customer">Customer-wise</TabsTrigger>
            <TabsTrigger value="tax">Tax Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Monthly Sales Summary</CardTitle>
                  <CardDescription>Sales data aggregated by month</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleExportCSV(
                      monthlySalesData.map((item) => ({ Month: item.name, Total: item.total })),
                      "monthly_sales",
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <LineChart data={monthlySalesData} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Sales Data</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Total Sales (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlySalesData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customer" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Customer-wise Billing</CardTitle>
                  <CardDescription>Total billing amount by customer</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleExportCSV(
                      customerWiseData.map((item) => ({ Customer: item.name, Total: item.total })),
                      "customer_billing",
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <BarChart data={customerWiseData.slice(0, 10)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer-wise Billing Data</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total Billing (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerWiseData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tax Breakdown</CardTitle>
                  <CardDescription>Monthly tax collection summary</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleExportCSV(
                      taxBreakdownData.map((item) => ({
                        Month: item.month,
                        Taxable: item.taxable,
                        Tax: item.tax,
                        Percentage: item.percentage,
                      })),
                      "tax_breakdown",
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Taxable Amount (₹)</TableHead>
                      <TableHead className="text-right">Tax Collected (₹)</TableHead>
                      <TableHead className="text-right">Effective Rate (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxBreakdownData.map((item) => (
                      <TableRow key={item.month}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell className="text-right">{item.taxable.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.tax.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
