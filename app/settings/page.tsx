"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import type { CompanyDetails } from "@/lib/types"
import { getCompanyDetails, updateCompanyDetails, initializeData } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    initializeData()
    loadCompanyDetails()
  }, [])

  const loadCompanyDetails = () => {
    setIsLoading(true)
    const details = getCompanyDetails()
    setCompanyDetails(details)
    setIsLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (!companyDetails) return

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setCompanyDetails({
        ...companyDetails,
        [parent]: {
          ...companyDetails[parent as keyof CompanyDetails],
          [child]: value,
        },
      })
    } else {
      setCompanyDetails({
        ...companyDetails,
        [name]: value,
      })
    }
  }

  const handleSave = () => {
    if (!companyDetails) return

    setIsSaving(true)

    try {
      updateCompanyDetails(companyDetails)
      toast({
        title: "Settings saved",
        description: "Your company details have been updated",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    try {
      // Clear localStorage
      localStorage.clear()

      // Reinitialize with default data
      initializeData()

      toast({
        title: "Data reset",
        description: "All data has been reset to default values",
      })

      // Reload the page
      window.location.reload()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset data",
      })
    } finally {
      setIsResetDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your application settings and company information</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        {companyDetails && (
          <>
            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Update your company details that will appear on invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name</Label>
                      <Input id="name" name="name" value={companyDetails.name} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" value={companyDetails.address} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstin">GSTIN</Label>
                      <Input id="gstin" name="gstin" value={companyDetails.gstin} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan">PAN</Label>
                      <Input id="pan" name="pan" value={companyDetails.pan} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={companyDetails.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" value={companyDetails.phone} onChange={handleChange} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bank Details</CardTitle>
                  <CardDescription>Update your bank information for invoices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankDetails.bankName">Bank Name</Label>
                      <Input
                        id="bankDetails.bankName"
                        name="bankDetails.bankName"
                        value={companyDetails.bankDetails.bankName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankDetails.branch">Branch</Label>
                      <Input
                        id="bankDetails.branch"
                        name="bankDetails.branch"
                        value={companyDetails.bankDetails.branch}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankDetails.accountNumber">Account Number</Label>
                      <Input
                        id="bankDetails.accountNumber"
                        name="bankDetails.accountNumber"
                        value={companyDetails.bankDetails.accountNumber}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankDetails.ifscCode">IFSC Code</Label>
                      <Input
                        id="bankDetails.ifscCode"
                        name="bankDetails.ifscCode"
                        value={companyDetails.bankDetails.ifscCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                  <CardDescription>Update the terms and conditions that appear on your invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                    <Textarea
                      id="termsAndConditions"
                      name="termsAndConditions"
                      value={companyDetails.termsAndConditions}
                      onChange={handleChange}
                      rows={5}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>Customize the appearance of the application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme-toggle">Dark Mode</Label>
                    <Switch
                      id="theme-toggle"
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Manage your application data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Reset Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will delete all your invoices, customers, and reset company information to default values.
                      This action cannot be undone.
                    </p>
                    <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">Reset All Data</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete all your invoices, customers, and
                            reset company information to default values.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleReset}>
                            Yes, Reset All Data
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
