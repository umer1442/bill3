"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInvoices, initializeData } from "@/lib/data-service"
import type { Invoice } from "@/lib/types"
import { BarChart, LineChart } from "@/components/charts"
import { useAuth } from "@/components/auth-provider"

export default function Dashboard() {
  const { isAuthenticated } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalTax: 0,
    activeCustomers: 0,
  })

  useEffect(() => {
    if (isAuthenticated) {
      try {
        initializeData()
        loadData()
      } catch (error) {
        console.error('Error initializing data:', error)
      }
    }
  }, [isAuthenticated])

  const loadData = () => {
    setIsLoading(true)
    const invoiceData = getInvoices()
    setInvoices(invoiceData)

    // Calculate stats
    const totalRevenue = invoiceData.reduce((sum, invoice) => sum + invoice.grandTotal, 0)
    const totalInvoices = invoiceData.length
    const totalTax = invoiceData.reduce((sum, invoice) => sum + invoice.totalIgst, 0)

    // Count unique customers - handle both customer types
    const uniqueCustomerIds = new Set()
    const manualCustomerNames = new Set()

    invoiceData.forEach((invoice) => {
      if (invoice.customer && invoice.customer.id) {
        uniqueCustomerIds.add(invoice.customer.id)
      } else if (invoice.manualCustomer && invoice.manualCustomer.name) {
        manualCustomerNames.add(invoice.manualCustomer.name)
      }
    })

    const activeCustomers = uniqueCustomerIds.size + manualCustomerNames.size

    setStats({
      totalRevenue,
      totalInvoices,
      totalTax,
      activeCustomers,
    })

    setIsLoading(false)
  }

  // Prepare data for charts
  const prepareChartData = () => {
    // Group invoices by month for line chart
    const monthlyData: Record<string, number> = {}

    invoices.forEach((invoice) => {
      const date = new Date(invoice.date)
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0
      }

      monthlyData[monthYear] += invoice.grandTotal
    })

    const lineChartData = Object.entries(monthlyData).map(([month, amount]) => ({
      name: month,
      total: amount,
    }))

    // Group invoices by customer for bar chart
    const customerData: Record<string, number> = {}

    invoices.forEach((invoice) => {
      // Handle both customer types
      const customerName = invoice.customer ? invoice.customer.name : invoice.manualCustomer?.name || "Unknown Customer"

      if (!customerData[customerName]) {
        customerData[customerName] = 0
      }

      customerData[customerName] += invoice.grandTotal
    })

    // Sort customers by total amount and take top 5
    const barChartData = Object.entries(customerData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }))

    return { lineChartData, barChartData }
  }

  const { lineChartData, barChartData } = prepareChartData()

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">
        Welcome to your invoice management dashboard. Here you can view your invoice statistics and manage your
        business.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalTax.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Chart will appear here when you have invoice data
              </div>
            ) : (
              <LineChart data={lineChartData} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Chart will appear here when you have customer data
              </div>
            ) : (
              <BarChart data={barChartData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
