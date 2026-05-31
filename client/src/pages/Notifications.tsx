import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle, Send, RefreshCw, CheckCircle2, XCircle, Users, User, Wifi, WifiOff,
  Bell, Trash2, Loader2
} from "lucide-react";
import { format } from "date-fns";
import type { Member } from "@shared/schema";

// ─── WhatsApp ──────────────────────────────────────────────────────────────

interface WhatsAppMessageLog {
  id: string;
  recipientType: "individual" | "all";
  memberId?: string;
  recipientName: string;
  phone: string;
  message: string;
  status: "sent" | "failed";
  errorMessage?: string;
  messageId?: string;
  createdAt: string;
}

interface WhatsAppStats {
  total: number;
  sent: number;
  failed: number;
}

interface WhatsAppStatus {
  configured: boolean;
  message: string;
  health?: { success: boolean; message: string; source?: 'wasender' | 'meta' | 'none' };
}

interface WhatsAppSendForm {
  recipientType: "individual" | "all";
  memberIds: string[];
  phone: string;
  recipientName: string;
  message: string;
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WhatsApp state
  const [waForm, setWaForm] = useState<WhatsAppSendForm>({
    recipientType: "individual",
    memberIds: [],
    phone: "",
    recipientName: "",
    message: "",
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  // ── WhatsApp queries & mutations ──────────────────────────────────────────

  const { data: waStatus, isLoading: waStatusLoading, refetch: refetchWaStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    retry: false,
  });

  const { data: waMessages = [], isLoading: waMessagesLoading, refetch: refetchWaMessages } = useQuery<WhatsAppMessageLog[]>({
    queryKey: ["/api/whatsapp/messages"],
  });

  const { data: waStats } = useQuery<WhatsAppStats>({
    queryKey: ["/api/whatsapp/stats"],
  });

  const waSendMutation = useMutation({
    mutationFn: async (data: WhatsAppSendForm) => {
      // Format phone number with 91 prefix for WhatsApp
      const formatPhoneForWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        if (cleanPhone.startsWith('91')) return cleanPhone;
        return '91' + cleanPhone;
      };

      // When multiple members are selected, send individually to each
      if (data.recipientType === "individual" && data.memberIds.length > 1) {
        const results = [];
        for (const memberId of data.memberIds) {
          const member = members.find(m => m.id === memberId);
          if (member?.phone) {
            const res = await apiRequest("POST", "/api/whatsapp/send", {
              recipientType: "individual",
              memberIds: [memberId],
              phone: formatPhoneForWhatsApp(member.phone),
              recipientName: `${member.firstName}${member.lastName ? ' ' + member.lastName : ''}`,
              message: data.message,
            });
            const result = await res.json();
            results.push(result);
          }
        }
        const sentCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;
        return { success: true, sentCount, failedCount, message: `Sent to ${sentCount} members` };
      }
      // Single member or phone number entered directly
      const res = await apiRequest("POST", "/api/whatsapp/send", {
        recipientType: data.recipientType,
        memberIds: data.memberIds.length > 0 ? data.memberIds : undefined,
        phone: data.phone ? formatPhoneForWhatsApp(data.phone) : undefined,
        recipientName: data.recipientName || undefined,
        message: data.message,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/stats"] });
      if (data.success) {
        toast({ title: data.recipientType === "all" ? `Broadcast: ${data.sentCount} sent, ${data.failedCount} failed` : "WhatsApp message sent!" });
        setWaForm(prev => ({ ...prev, message: "" }));
      } else {
        toast({ title: "Failed to send", description: data.message, variant: "destructive" });
      }
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const waDeleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiRequest("DELETE", `/api/whatsapp/messages/${messageId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/stats"] });
      toast({ title: "Message deleted" });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleWaSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waForm.message.trim()) {
      return toast({ title: "Error", description: "Message cannot be empty", variant: "destructive" });
    }
    if (waForm.recipientType === "individual" && waForm.memberIds.length === 0 && !waForm.phone) {
      return toast({ title: "Error", description: "Please select members or enter a phone number", variant: "destructive" });
    }
    waSendMutation.mutate(waForm);
  };

  const isWaConnected = waStatus?.configured && waStatus?.health?.success;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold font-heading text-foreground uppercase tracking-tight">NOTIFICATIONS</h1>
          <p className="text-muted-foreground">Send and manage WhatsApp notifications for your gym members.</p>
        </div>

        <Tabs defaultValue="whatsapp" className="w-full">
          <TabsList className="mb-6 bg-muted/60 border border-border">
            <TabsTrigger value="whatsapp" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider text-xs">
              <MessageCircle className="h-4 w-4" /> WhatsApp Notifications
            </TabsTrigger>
          </TabsList>

          {/* ── WhatsApp Tab ───────────────────────────────────────────── */}
          <TabsContent value="whatsapp">
            <div className="space-y-6">

              {/* Status Banner */}
              <Card className={`border ${isWaConnected ? "border-green-500/40 bg-green-500/5" : "border-yellow-500/40 bg-yellow-500/5"}`}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {waStatusLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : isWaConnected ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">
                        {waStatusLoading ? "Checking connection..." :
                          isWaConnected ? "WhatsApp Connected" :
                          waStatus?.configured ? "API Configured but Unreachable" :
                          "WhatsApp Not Configured"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {waStatus?.health?.message || waStatus?.message || "Configure WhatsApp API to enable messaging"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground"
                    onClick={() => { refetchWaStatus(); refetchWaMessages(); }}>
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Row */}
              {waStats && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-card/50 border-border">
                    <CardContent className="py-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                        <Send className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{waStats.total}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sent</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 border-border">
                    <CardContent className="py-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">{waStats.sent}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Delivered</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 border-border">
                    <CardContent className="py-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-red-500/20 flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-500">{waStats.failed}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Failed</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Compose Form */}
                <Card className="bg-card/50 border-border">
                  <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg font-bold font-heading uppercase tracking-tight flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-primary" /> Compose Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleWaSend} className="space-y-5">
                      {/* Recipient Type */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Send To</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={waForm.recipientType === "individual" ? "default" : "outline"}
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => setWaForm(prev => ({ ...prev, recipientType: "individual", memberIds: [], phone: "", recipientName: "" }))}
                          >
                            <User className="h-3.5 w-3.5" /> Individual
                          </Button>
                          <Button
                            type="button"
                            variant={waForm.recipientType === "all" ? "default" : "outline"}
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => setWaForm(prev => ({ ...prev, recipientType: "all", memberIds: [], phone: "", recipientName: "" }))}
                          >
                            <Users className="h-3.5 w-3.5" /> All Members
                          </Button>
                        </div>
                      </div>

                      {/* Member/Phone selector */}
                      {waForm.recipientType === "individual" && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Members</Label>
                            <SearchableMultiSelect
                              value={waForm.memberIds}
                              onValueChange={(val) => {
                                const selectedMembers = members.filter(m => val.includes(m.id));
                                const phoneNumbers = selectedMembers.map(m => m.phone).filter(Boolean);
                                setWaForm({ 
                                  ...waForm, 
                                  memberIds: val,
                                  phone: phoneNumbers.join(', ')
                                });
                              }}
                              members={members}
                              placeholder="Choose members"
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number(s)</Label>
                            <Input
                              value={waForm.phone}
                              onChange={(e) => setWaForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+966XXXXXXXXX"
                              className="bg-background border-border h-11"
                            />
                            <p className="text-xs text-muted-foreground">International format, e.g. +966501234567</p>
                          </div>
                        </div>
                      )}

                      {waForm.recipientType === "all" && (
                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-600 dark:text-yellow-400">
                          This will send a message to all <strong>{members.length}</strong> members who have a phone number on file.
                        </div>
                      )}

                      {/* Message */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Message <span className="text-destructive">*</span>
                        </Label>
                        <textarea
                          value={waForm.message}
                          onChange={(e) => setWaForm(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Type your WhatsApp message here..."
                          className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          required
                        />
                        <p className="text-xs text-muted-foreground text-right">{waForm.message.length}/1000</p>
                      </div>

                      {/* Preview */}
                      {waForm.message && (
                        <div className="rounded-xl bg-[#e9fde5] dark:bg-[#1a2e1a] p-3 border border-green-200 dark:border-green-900">
                          <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">WhatsApp Preview</p>
                          <div className="bg-white dark:bg-[#1f321f] rounded-lg p-3 shadow-sm max-w-xs">
                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{waForm.message}</p>
                            <p className="text-[10px] text-gray-400 text-right mt-1">{format(new Date(), "h:mm a")}</p>
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 bg-[#25D366] hover:bg-[#20bd59] text-white font-bold uppercase tracking-wider gap-2 shadow-lg shadow-green-500/20"
                        disabled={waSendMutation.isPending || (waForm.recipientType === "individual" && waForm.memberIds.length === 0 && !waForm.phone)}
                      >
                        {waSendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {waSendMutation.isPending ? "Sending..." : waForm.recipientType === "all" ? "Broadcast to All Members" : "Send WhatsApp Message"}
                      </Button>
                      {!isWaConnected && !waStatusLoading && (
                        <p className="text-xs text-center text-muted-foreground">WhatsApp not connected. Check API configuration to enable messaging.</p>
                      )}
                    </form>
                  </CardContent>
                </Card>

                {/* Message History */}
                <Card className="bg-card/50 border-border">
                  <CardHeader className="border-b border-border pb-4">
                    <CardTitle className="text-lg font-bold font-heading uppercase tracking-tight flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" /> Message History
                      <Badge variant="secondary" className="ml-auto text-xs">{waMessages.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {waMessagesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : waMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <MessageCircle className="h-10 w-10 mb-3 opacity-40" />
                        <p className="text-sm font-medium">No messages sent yet</p>
                        <p className="text-xs">Messages will appear here after sending</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[480px]">
                        <div className="divide-y divide-border">
                          {waMessages.map((msg) => (
                            <div key={msg.id} className="px-5 py-4 hover:bg-muted/30 transition-colors group">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.status === "sent" ? "bg-green-500/15" : "bg-red-500/15"}`}>
                                    {msg.status === "sent"
                                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                      : <XCircle className="h-3.5 w-3.5 text-red-500" />
                                    }
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-sm truncate">{msg.recipientName}</p>
                                      {msg.recipientType === "all" && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Broadcast</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{msg.phone}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                    {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                                    onClick={() => {
                                      if (confirm("Delete this message from history?")) {
                                        waDeleteMutation.mutate(msg.id);
                                      }
                                    }}
                                    disabled={waDeleteMutation.isPending}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground line-clamp-2 pl-9">{msg.message}</p>
                              {msg.errorMessage && (
                                <p className="mt-1 text-xs text-red-500 pl-9">Error: {msg.errorMessage}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
