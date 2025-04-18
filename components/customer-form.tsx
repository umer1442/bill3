"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Customer } from "@/lib/types"
import { addCustomer, updateCustomer } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"

interface CustomerFormProps {
  customer: Customer | null
  onSuccess: () => void
}

export default function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const [formData, setFormData] = useState<Partial<Customer>>(
    customer || {
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      pan: "",
      gstin: "",
    },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (customer) {
        // Update existing customer
        updateCustomer(customer.id, formData)
        toast({
          title: "Customer updated",
          description: "Customer information has been updated successfully",
        })
      } else {
        // Add new customer
        addCustomer(formData as Omit<Customer, "id" | "createdAt" | "updatedAt">)
        toast({
          title: "Customer added",
          description: "New customer has been added successfully",
        })
      }
      onSuccess()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save customer information",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Customer Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" value={formData.state} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pincode">PIN Code</Label>
          <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pan">PAN</Label>
          <Input id="pan" name="pan" value={formData.pan} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN</Label>
          <Input id="gstin" name="gstin" value={formData.gstin} onChange={handleChange} required />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : customer ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </form>
  )
}
