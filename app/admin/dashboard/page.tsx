"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Wrench,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Eye,
  UserCheck,
  UserX,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Building,
  LogOut,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/api"


type Category = { id: string; name: string };
type Brand = { id: string; name: string; category_id: string };

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [agentRequests, setAgentRequests] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)
  const [reassignAgent, setReassignAgent] = useState("")
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [deviceForm, setDeviceForm] = useState({ category: "", brand: "", model: "" })
  const [newBrand, setNewBrand] = useState("");
  const [addingDevice, setAddingDevice] = useState(false);
  const [brandError, setBrandError] = useState("");
  const [cities, setCities] = useState<{ id: string, name: string }[]>([])

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);

  const [showAddCity, setShowAddCity] = useState(false);
  const [cityForm, setCityForm] = useState({ name: "", state: "", pincodes: "", delivery_charges_standard: "", delivery_charges_express: "" });
  const [addingCity, setAddingCity] = useState(false);
  const addCityDialogRef = useRef(null);

  // Add state for approval/rejection and tempPassword
  const [actionStates, setActionStates] = useState<Record<string, { approved: boolean, rejected: boolean, tempPassword?: string }>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Faults Management State
  const [faultsTabDevices, setFaultsTabDevices] = useState<any[]>([]);
  const [faultsTabFaults, setFaultsTabFaults] = useState<any[]>([]);
  const [faultsTabLoading, setFaultsTabLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [showAddFault, setShowAddFault] = useState(false);
  const [addFaultForm, setAddFaultForm] = useState({ name: "", description: "", price: "" });
  const [editingFault, setEditingFault] = useState<any>(null);
  const [editFaultForm, setEditFaultForm] = useState({ name: "", description: "", price: "" });
  const [faultsTabError, setFaultsTabError] = useState("");

  const [selectedTab, setSelectedTab] = useState("agent-requests");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.from('stats').select('*')
        setStats(data?.[0] || null)
        setLoading(false)
      } catch {
        setError("Failed to load dashboard data")
        setLoading(false)
      }
    }
    fetchStats()
    // Subscribe to stats changes if needed
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [agentsRes, agentRequestsRes, bookingsRes] = await Promise.all([
          supabase.from('agents').select('*'),
          supabase.from('agent_applications').select('*').eq('status', 'pending'),
          supabase.from('bookings').select('*'),
        ])
        setAgents(agentsRes.data || [])
        setAgentRequests(agentRequestsRes.data || [])
        setBookings(bookingsRes.data || [])
      } catch {
        setAgents([])
        setAgentRequests([])
        setBookings([])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    // Subscribe to agents, agent_applications, and bookings table changes
    const channel = supabase.channel('realtime:admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, (payload) => { fetchAll() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_applications' }, (payload) => { fetchAll() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => { fetchAll() })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    supabase.from('cities').select('id, name').then(({ data }) => setCities(data || []))
  }, [])

  useEffect(() => {
    setCategoryLoading(true);
    supabase.from('categories').select('*').then(({ data }) => {
      setCategories(data || []);
      setCategoryLoading(false);
    });
  }, []);

  useEffect(() => {
    if (deviceForm.category) {
      setBrandLoading(true);
      supabase.from('brands').select('*').eq('category_id', deviceForm.category).then(({ data }) => {
        setBrands(data || []);
        setBrandLoading(false);
      });
    } else {
      setBrands([]);
    }
  }, [deviceForm.category]);

  useEffect(() => {
    if (selectedTab !== "faults") return;
    setFaultsTabLoading(true);
    Promise.all([
      supabase.from("devices").select("id, model, brand_id, category_id"),
      supabase.from("faults").select("id, device_id, name, description, price, is_active")
    ]).then(([devicesRes, faultsRes]) => {
      setFaultsTabDevices(devicesRes.data || []);
      setFaultsTabFaults(faultsRes.data || []);
      setFaultsTabLoading(false);
    });
  }, [selectedTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleApproveAgent = async (requestId: string) => {
    try {
      const application = agentRequests.find((req) => req.id === requestId)
      if (!application) return

      // Do NOT create a new Auth user here!
      const res = await fetch('/api/agents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: { ...application }, admin_id: user?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to approve agent')
      setActionStates((prev) => ({ ...prev, [requestId]: { approved: true, rejected: false } }))
      toast({
        title: "Agent Approved",
        description: "Agent request has been approved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve agent application.",
        variant: "destructive",
      })
    }
  }
  const handleRejectAgent = async (requestId: string) => {
    setRejectingId(requestId);
  }
  const confirmRejectAgent = async (requestId: string) => {
    try {
      const res = await fetch('/api/agents/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: requestId, adminId: user?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to reject agent')
      setActionStates((prev) => ({ ...prev, [requestId]: { approved: false, rejected: true } }))
      setRejectingId(null);
      toast({
        title: "Agent Rejected",
        description: "Agent request has been rejected",
        variant: "destructive",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject agent application.",
        variant: "destructive",
      })
      setRejectingId(null);
    }
  }

  const handleReassignBooking = (bookingId: string) => {
    if (!reassignAgent) {
      toast({
        title: "Error",
        description: "Please select an agent to reassign",
        variant: "destructive",
      })
      return
    }

    setBookings((bookings) =>
      bookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              agentId: reassignAgent,
              agent: agents.find((a) => a.id === reassignAgent)?.name || "Unknown",
              status: "assigned",
            }
          : booking,
      ),
    )

    setSelectedBooking(null)
    setReassignAgent("")

    toast({
      title: "Booking Reassigned",
      description: "Booking has been reassigned successfully",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "in-progress":
      case "assigned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
      case "cancelled":
        return <UserX className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "in-progress":
      case "assigned":
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getCityName = (city_id: string) => {
    const city = cities.find(c => c.id === city_id)
    return city ? city.name : ''
  }

  const filteredRequests = agentRequests.filter((request: any) => {
    const matchesSearch =
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const filteredBookings = bookings.filter((booking: any) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.device.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    const matchesCity = cityFilter === "all" || booking.city === cityFilter

    return matchesSearch && matchesStatus && matchesCity
  })

  const handleAddDevice = async () => {
    setBrandError("");
    let brandName = deviceForm.brand;
    if (deviceForm.brand === "__new__") {
      // Check if brand exists for this category
      const { data: existing, error: existErr } = await supabase.from('brands').select('*').eq('name', newBrand.trim()).eq('category_id', deviceForm.category);
      if (existErr) {
        toast({ title: "Error", description: existErr.message, variant: "destructive" });
        return;
      }
      if (existing && existing.length > 0) {
        brandName = existing[0].name;
      } else {
        // Insert new brand
        const { data: inserted, error: insertErr } = await supabase.from('brands').insert([{ name: newBrand.trim(), category_id: deviceForm.category }]).select().single();
        if (insertErr) {
          toast({ title: "Error", description: insertErr.message, variant: "destructive" });
          return;
        }
        brandName = inserted.name;
      }
    }
    if (!deviceForm.category || !brandName || !deviceForm.model) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    setAddingDevice(true);
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: deviceForm.category,
          brand_name: brandName,
          model: deviceForm.model.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message && data.message.toLowerCase().includes("duplicate")) {
          setBrandError("Device with this category, brand, and model already exists.");
          toast({ title: "Already Exists", description: "This device already exists.", variant: "destructive" });
        } else {
          toast({ title: "Error", description: data.message || "Failed to add device", variant: "destructive" });
        }
        setAddingDevice(false);
        return;
      }
      toast({ title: "Device Added", description: `${deviceForm.model} added to selected brand and category` });
      setDeviceForm({ category: "", brand: "", model: "" });
      setNewBrand("");
      setBrandError("");
      setAddingDevice(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add device", variant: "destructive" });
      setAddingDevice(false);
    }
  };

  const handleAddCity = async () => {
    setAddingCity(true);
    const pincodesArr = cityForm.pincodes.split(",").map(p => p.trim()).filter(Boolean);
    const delivery_charges_standard = cityForm.delivery_charges_standard ? parseFloat(cityForm.delivery_charges_standard) : 50;
    const delivery_charges_express = cityForm.delivery_charges_express ? parseFloat(cityForm.delivery_charges_express) : 100;
    try {
      const res = await fetch("/api/admin/add-city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cityForm.name.trim(),
          state: cityForm.state.trim(),
          pincodes: pincodesArr,
          delivery_charges_standard,
          delivery_charges_express,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Failed to add city", variant: "destructive" });
        setAddingCity(false);
        return;
      }
      toast({ title: "City Added", description: `${cityForm.name} added successfully` });
      setShowAddCity(false);
      setCityForm({ name: "", state: "", pincodes: "", delivery_charges_standard: "", delivery_charges_express: "" });
      setAddingCity(false);
      // Optionally: refresh city list here
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add city", variant: "destructive" });
      setAddingCity(false);
    }
  };

  // Add Fault
  const handleAddFault = async () => {
    setFaultsTabError("");
    if (!selectedDeviceId || !addFaultForm.name || !addFaultForm.price) {
      setFaultsTabError("Please fill all required fields.");
      return;
    }
    const price = parseFloat(addFaultForm.price);
    if (isNaN(price)) {
      setFaultsTabError("Price must be a number.");
      return;
    }
    const { error } = await supabase.from("faults").insert([
      {
        device_id: selectedDeviceId,
        name: addFaultForm.name.trim(),
        description: addFaultForm.description.trim(),
        price,
      }
    ]);
    if (error) {
      setFaultsTabError(error.message);
      return;
    }
    setAddFaultForm({ name: "", description: "", price: "" });
    setShowAddFault(false);
    // Refresh faults
    const { data } = await supabase.from("faults").select("id, device_id, name, description, price, is_active");
    setFaultsTabFaults(data || []);
  };

  // Edit Fault
  const handleEditFault = async () => {
    setFaultsTabError("");
    if (!editingFault || !editFaultForm.name || !editFaultForm.price) {
      setFaultsTabError("Please fill all required fields.");
      return;
    }
    const price = parseFloat(editFaultForm.price);
    if (isNaN(price)) {
      setFaultsTabError("Price must be a number.");
      return;
    }
    const { error } = await supabase.from("faults").update({
      name: editFaultForm.name.trim(),
      description: editFaultForm.description.trim(),
      price,
    }).eq("id", editingFault.id);
    if (error) {
      setFaultsTabError(error.message);
      return;
    }
    setEditingFault(null);
    // Refresh faults
    const { data } = await supabase.from("faults").select("id, device_id, name, description, price, is_active");
    setFaultsTabFaults(data || []);
  };

  // Soft Delete Fault
  const handleDeleteFault = async (faultId: string) => {
    const { error } = await supabase.from("faults").update({ is_active: false }).eq("id", faultId);
    if (error) {
      setFaultsTabError(error.message);
      return;
    }
    // Refresh faults
    const { data } = await supabase.from("faults").select("id, device_id, name, description, price, is_active");
    setFaultsTabFaults(data || []);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground">Admin dashboard overview and management</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border rounded text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Add Device Button */}
        <div className="flex justify-end">
          <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
            <DialogTrigger asChild>
              <Button variant="default">+ Add Device</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Device</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={deviceForm.category} onValueChange={val => setDeviceForm(f => ({ ...f, category: val, brand: "", model: "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={categoryLoading ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={deviceForm.brand === "__new__" ? "__new__" : deviceForm.brand}
                  onValueChange={val => {
                    setBrandError("");
                    setDeviceForm(f => ({ ...f, brand: val }));
                    if (val !== "__new__") setNewBrand("");
                  }}
                  disabled={!deviceForm.category || brandLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={brandLoading ? "Loading..." : "Select brand"} />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                    <SelectItem value="__new__">Add new brand...</SelectItem>
                  </SelectContent>
                </Select>
                {deviceForm.brand === "__new__" && (
                  <Input
                    placeholder="Enter new model name"
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    className={brandError ? "border-red-500" : ""}
                  />
                )}
                <Input placeholder="model name" value={deviceForm.model} onChange={e => setDeviceForm(f => ({ ...f, model: e.target.value }))} />
                {brandError && <div className="text-red-500 text-sm">{brandError}</div>}
              </div>
              <DialogFooter>
                <Button onClick={handleAddDevice} disabled={addingDevice}>{addingDevice ? "Adding..." : "Add Device"}</Button>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Add City Button */}
        <div className="flex justify-end mb-4">
          <Button variant="default" onClick={() => setShowAddCity(true)}>+ Add City</Button>
        </div>
        <Dialog open={showAddCity} onOpenChange={setShowAddCity}>
          <DialogTrigger asChild></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add City</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input ref={addCityDialogRef} placeholder="City name" value={cityForm.name} onChange={e => setCityForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder="State" value={cityForm.state} onChange={e => setCityForm(f => ({ ...f, state: e.target.value }))} />
              <Input placeholder="Pincodes (comma separated)" value={cityForm.pincodes} onChange={e => setCityForm(f => ({ ...f, pincodes: e.target.value }))} />
              <Input placeholder="Delivery Charge Standard (default 50)" type="number" value={cityForm.delivery_charges_standard} onChange={e => setCityForm(f => ({ ...f, delivery_charges_standard: e.target.value }))} />
              <Input placeholder="Delivery Charge Express (default 100)" type="number" value={cityForm.delivery_charges_express} onChange={e => setCityForm(f => ({ ...f, delivery_charges_express: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button onClick={handleAddCity} disabled={addingCity}>{addingCity ? "Adding..." : "Add City"}</Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats?.totalUsers?.toLocaleString() ?? 0}</div>
              {/* Optionally add growth if available */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats?.totalAgents ?? 0}</div>
              <p className="text-xs text-muted-foreground">{loading ? "..." : `${stats?.pendingAgents ?? 0} pending requests`}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats?.totalBookings ?? 0}</div>
              <p className="text-xs text-muted-foreground">{loading ? "..." : `${stats?.pendingBookings ?? 0} active, ${stats?.completedBookings ?? 0} completed`}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{loading ? "..." : ((stats?.totalRevenue ?? 0) / 100000).toFixed(1)}L</div>
              <p className="text-xs text-muted-foreground">₹{loading ? "..." : (stats?.totalRevenue ?? 0).toLocaleString()} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="agent-requests">Agent Requests ({loading ? "..." : stats?.pendingAgents ?? 0})</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="bookings">All Bookings</TabsTrigger>
            <TabsTrigger value="cities">City Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="faults">Faults Management</TabsTrigger>
          </TabsList>

          {/* Agent Requests Tab */}
          <TabsContent value="agent-requests" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Agent Applications</CardTitle>
                    <CardDescription>Review and manage agent applications</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search agents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-[200px]"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p>Loading agent requests...</p>
                  ) : filteredRequests.map((request: any) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{request.name}</h3>
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1 capitalize">{request.status}</span>
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                            <p className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <strong>Shop:</strong> {request.shop_name}
                            </p>
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <strong>Email:</strong> {request.email}
                            </p>
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <strong>Phone:</strong> {request.phone}
                            </p>
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <strong>City:</strong> {getCityName(request.city_id)}
                            </p>
                            <p>
                              <strong>Experience:</strong> {request.experience} years
                            </p>
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Applied: {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Address:</p>
                            <p className="text-sm text-muted-foreground">{request.shop_address}</p>
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Specializations:</p>
                            <div className="flex flex-wrap gap-1">
                              {request.specializations.map((spec: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <div className="text-right mb-2">
                            <p className="text-xs text-muted-foreground">Application ID: {request.id}</p>
                            {request.approvedDate && (
                              <p className="text-xs text-green-600">
                                Approved: {new Date(request.approvedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {request.status === "pending" && (
                            <div className="flex flex-col gap-2">
                              <Button size="sm" onClick={() => handleApproveAgent(request.id)} className="w-full" disabled={actionStates[request.id]?.approved || actionStates[request.id]?.rejected}>
                                <UserCheck className="h-3 w-3 mr-1" />
                                {actionStates[request.id]?.approved ? "Approved" : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectAgent(request.id)}
                                className="w-full"
                                disabled={actionStates[request.id]?.approved || actionStates[request.id]?.rejected}
                              >
                                <UserX className="h-3 w-3 mr-1" />
                                {actionStates[request.id]?.rejected ? "Rejected" : "Reject"}
                              </Button>
                              {actionStates[request.id]?.approved && actionStates[request.id]?.tempPassword && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <strong>Temporary Password:</strong> <span className="font-mono select-all">{actionStates[request.id].tempPassword}</span>
                                  <div className="text-muted-foreground text-xs mt-1">Copy and send this password to the agent.</div>
                                </div>
                              )}
                            </div>
                          )}
                          <Button size="sm" variant="outline" className="w-full" onClick={() => setExpandedRequestId(expandedRequestId === request.id ? null : request.id)}>
                            <Eye className="h-3 w-3 mr-1" />
                            {expandedRequestId === request.id ? 'Hide Details' : 'View Details'}
                          </Button>
                        </div>
                      </div>
                      <motion.div
                        initial={false}
                        animate={expandedRequestId === request.id ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        {expandedRequestId === request.id && (
                          <div className="mt-4 p-4 border-t bg-muted/50 rounded-b-lg">
                            <h4 className="font-semibold mb-2">ID Proof</h4>
                            {request.id_proof ? (
                              <img
                                src={request.id_proof}
                                alt="ID Proof"
                                className="w-full max-w-xs rounded shadow mb-4 border"
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground mb-4">No ID proof uploaded.</p>
                            )}
                            <h4 className="font-semibold mb-2">Shop Images</h4>
                            {request.shop_images && request.shop_images.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {request.shop_images.map((img: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Shop Image ${idx + 1}`}
                                    className="w-full h-32 object-cover rounded shadow border"
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No shop images uploaded.</p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agents</CardTitle>
                <CardDescription>List of all approved agents</CardDescription>
              </CardHeader>
              <CardContent>
                <AgentsTable agents={agents} cities={cities} getCityName={getCityName} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>All Bookings</CardTitle>
                    <CardDescription>Manage and track all repair bookings</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-[200px]"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={cityFilter} onValueChange={setCityFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {/* Add city options here */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p>Loading bookings...</p>
                  ) : filteredBookings.map((booking: any) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{booking.device}</h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1 capitalize">{booking.status.replace("-", " ")}</span>
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                            <p>
                              <strong>Customer:</strong> {booking.customer}
                            </p>
                            <p>
                              <strong>Email:</strong> {booking.customerEmail}
                            </p>
                            <p>
                              <strong>Phone:</strong> {booking.customerPhone}
                            </p>
                            <p>
                              <strong>Agent:</strong> {booking.agent}
                            </p>
                            <p>
                              <strong>Issue:</strong> {booking.issue}
                            </p>
                            <p>
                              <strong>Service:</strong> {booking.serviceType}
                            </p>
                            <p>
                              <strong>City:</strong> {booking.city}
                            </p>
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(booking.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <div className="text-right mb-2">
                            <p className="font-semibold">₹{booking.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Booking ID: {booking.id}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {booking.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedBooking(booking.id)}
                                className="w-full"
                              >
                                Reassign Agent
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="w-full">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Reassign Agent Modal */}
                      {selectedBooking === booking.id && (
                        <div className="mt-4 p-4 border-t bg-muted/50 rounded-b-lg">
                          <h4 className="font-medium mb-3">Reassign to Agent</h4>
                          <div className="flex gap-2">
                            <Select value={reassignAgent} onValueChange={setReassignAgent}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select agent" />
                              </SelectTrigger>
                              <SelectContent>
                                {agents.map((agent: any) => (
                                  <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name} - {agent.shop_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={() => handleReassignBooking(booking.id)}>
                              Assign
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setSelectedBooking(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cities Tab */}
          <TabsContent value="cities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>City Management</CardTitle>
                <CardDescription>Manage service areas and city-wise performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cities.map((city) => (
                    <div key={city.id} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{city.name}</h4>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline" className="text-red-500">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Monthly revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>This Month</span>
                      <span className="font-semibold">₹8.5L</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Month</span>
                      <span className="font-semibold">₹7.2L</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Growth</span>
                      <span className="font-semibold text-green-600">+18.1%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Type Distribution</CardTitle>
                  <CardDescription>Breakdown by service type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Local Dropoff</span>
                      <span className="font-semibold">45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Collection & Delivery</span>
                      <span className="font-semibold">35%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Postal Service</span>
                      <span className="font-semibold">20%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">4.8</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">2.3</div>
                    <div className="text-sm text-muted-foreground">Avg Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">89%</div>
                    <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Faults Management Tab */}
          <TabsContent value="faults" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Faults Management</CardTitle>
                <CardDescription>Manage faults for each device</CardDescription>
              </CardHeader>
              <CardContent>
                {faultsTabLoading ? (
                  <div>Loading devices and faults...</div>
                ) : (
                  <div>
                    <div className="mb-4 flex gap-2 items-end">
                      <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId} className="w-64">
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          {faultsTabDevices.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => setShowAddFault(true)} disabled={!selectedDeviceId}>
                        <Plus className="h-4 w-4 mr-1" /> Add Fault
                      </Button>
                    </div>
                    {selectedDeviceId && (
                      <div className="space-y-2">
                        <h4 className="font-semibold mb-2">Faults for this device</h4>
                        <table className="min-w-full border text-sm">
                          <thead>
                            <tr className="bg-muted">
                              <th className="px-2 py-1 text-left">Name</th>
                              <th className="px-2 py-1 text-left">Description</th>
                              <th className="px-2 py-1 text-right">Price</th>
                              <th className="px-2 py-1 text-center">Active</th>
                              <th className="px-2 py-1 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {faultsTabFaults.filter(f => f.device_id === selectedDeviceId).map(fault => (
                              <tr key={fault.id} className={fault.is_active ? "" : "opacity-50"}>
                                <td className="px-2 py-1">{fault.name}</td>
                                <td className="px-2 py-1">{fault.description}</td>
                                <td className="px-2 py-1 text-right">₹{fault.price}</td>
                                <td className="px-2 py-1 text-center">{fault.is_active ? "Yes" : "No"}</td>
                                <td className="px-2 py-1 text-center flex gap-2 justify-center">
                                  <Button size="icon" variant="ghost" onClick={() => {
                                    setEditingFault(fault);
                                    setEditFaultForm({ name: fault.name, description: fault.description || "", price: String(fault.price) });
                                  }}><Pencil className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleDeleteFault(fault.id)} disabled={!fault.is_active}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {faultsTabError && <div className="text-red-500 mt-2">{faultsTabError}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Add Fault Dialog */}
            {showAddFault && (
              <Dialog open={showAddFault} onOpenChange={setShowAddFault}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Fault</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Fault name" value={addFaultForm.name} onChange={e => setAddFaultForm(f => ({ ...f, name: e.target.value }))} />
                    <Input placeholder="Description (optional)" value={addFaultForm.description} onChange={e => setAddFaultForm(f => ({ ...f, description: e.target.value }))} />
                    <Input placeholder="Price" type="number" value={addFaultForm.price} onChange={e => setAddFaultForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddFault}>Add</Button>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                  </DialogFooter>
                  {faultsTabError && <div className="text-red-500 mt-2">{faultsTabError}</div>}
                </DialogContent>
              </Dialog>
            )}
            {/* Edit Fault Dialog */}
            {editingFault && (
              <Dialog open={!!editingFault} onOpenChange={open => { if (!open) setEditingFault(null); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Fault</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Fault name" value={editFaultForm.name} onChange={e => setEditFaultForm(f => ({ ...f, name: e.target.value }))} />
                    <Input placeholder="Description (optional)" value={editFaultForm.description} onChange={e => setEditFaultForm(f => ({ ...f, description: e.target.value }))} />
                    <Input placeholder="Price" type="number" value={editFaultForm.price} onChange={e => setEditFaultForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleEditFault}>Save</Button>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                  </DialogFooter>
                  {faultsTabError && <div className="text-red-500 mt-2">{faultsTabError}</div>}
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {/* Reject confirmation modal */}
      {rejectingId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Reject Application</h2>
            <p className="mb-4">Do you really want to reject the application?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => confirmRejectAgent(rejectingId)}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function AgentsTable({ agents, cities, getCityName }: { agents: any[], cities: any[], getCityName: (id: string) => string }) {
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const approvedAgents = agents.filter((a) => a);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr className="bg-muted">
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Shop Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">City</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Online</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Rating</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Completed Jobs</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Earnings (₹)</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {approvedAgents.map((agent) => (
            <>
              <tr key={agent.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap">{agent.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{agent.shop_name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{agent.phone}</td>
                <td className="px-4 py-2 whitespace-nowrap">{agent.email}</td>
                <td className="px-4 py-2 whitespace-nowrap">{getCityName(agent.city_id)}</td>
                <td className="px-4 py-2 text-center">{agent.is_online ? '✅' : '❌'}</td>
                <td className="px-4 py-2 text-center">{agent.rating_average?.toFixed(1) ?? '0.0'} <span className="text-xs text-muted-foreground">({agent.rating_count ?? 0})</span></td>
                <td className="px-4 py-2 text-center">{agent.completed_jobs ?? 0}</td>
                <td className="px-4 py-2 text-center">{agent.earnings_total?.toLocaleString() ?? '0'}</td>
                <td className="px-4 py-2 text-center">
                  <Button size="sm" variant="outline" onClick={() => setExpandedAgentId(expandedAgentId === agent.id ? null : agent.id)}>
                    <Eye className="h-3 w-3 mr-1" />
                    {expandedAgentId === agent.id ? 'Hide Details' : 'View Details'}
                  </Button>
                </td>
              </tr>
              <tr>
                <td colSpan={10} className="p-0 border-none">
                  <motion.div
                    initial={false}
                    animate={expandedAgentId === agent.id ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    {expandedAgentId === agent.id && (
                      <div className="p-4 bg-muted/50 rounded-b-lg flex flex-col md:flex-row gap-6">
                        <div className="flex-shrink-0">
                          <h4 className="font-semibold mb-2">ID Proof</h4>
                          <img src={agent.id_proof} alt="ID Proof" className="w-40 h-40 object-cover rounded shadow border mb-4" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-1">Specializations</h4>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {(agent.specializations || []).length > 0 ? agent.specializations.map((spec: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{spec}</Badge>
                              )) : <span className="text-muted-foreground text-xs">None</span>}
                            </div>
                            <h4 className="font-semibold mb-1">Experience</h4>
                            <p className="text-sm text-muted-foreground mb-2">{agent.experience || 'N/A'}</p>
                            <h4 className="font-semibold mb-1">Last Seen</h4>
                            <p className="text-sm text-muted-foreground mb-2">{agent.last_seen ? new Date(agent.last_seen).toLocaleString() : 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Earnings Paid</h4>
                            <p className="text-sm text-muted-foreground mb-2">₹{agent.earnings_paid?.toLocaleString() ?? '0'}</p>
                            <h4 className="font-semibold mb-1">Earnings Pending</h4>
                            <p className="text-sm text-muted-foreground mb-2">₹{agent.earnings_pending?.toLocaleString() ?? '0'}</p>
                            <h4 className="font-semibold mb-1">Created At</h4>
                            <p className="text-sm text-muted-foreground mb-2">{agent.created_at ? new Date(agent.created_at).toLocaleString() : 'N/A'}</p>
                            <h4 className="font-semibold mb-1">Updated At</h4>
                            <p className="text-sm text-muted-foreground mb-2">{agent.updated_at ? new Date(agent.updated_at).toLocaleString() : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
