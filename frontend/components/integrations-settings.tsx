"use client";

import * as React from "react";
import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandWhatsapp,
  IconCalendar,
  IconCheck,
  IconMail,
  IconPlug,
  IconSettings,
  IconShield,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "connected" | "disconnected" | "error";
  category: "calendar" | "social" | "messaging" | "email";
  features: string[];
  requiresApi: boolean;
  apiKeyLabel?: string;
  webhookUrl?: string;
}

const integrations: Integration[] = [
  {
    id: "calendly",
    name: "Calendly",
    description: "Automatically schedule meetings with qualified leads",
    icon: IconCalendar,
    status: "disconnected",
    category: "calendar",
    features: [
      "Auto-schedule meetings",
      "Send booking links",
      "Sync availability",
      "Meeting reminders",
    ],
    requiresApi: true,
    apiKeyLabel: "Calendly API Token",
    webhookUrl: "/api/webhooks/calendly",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Receive leads and send automated messages via WhatsApp",
    icon: IconBrandWhatsapp,
    status: "disconnected",
    category: "messaging",
    features: [
      "Receive lead messages",
      "Auto-respond to inquiries",
      "Send follow-ups",
      "Media sharing",
    ],
    requiresApi: true,
    apiKeyLabel: "WhatsApp Business API Token",
    webhookUrl: "/api/webhooks/whatsapp",
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Connect with leads from Instagram DMs and comments",
    icon: IconBrandInstagram,
    status: "disconnected",
    category: "social",
    features: [
      "Monitor DMs",
      "Track comments",
      "Auto-respond to mentions",
      "Lead qualification",
    ],
    requiresApi: true,
    apiKeyLabel: "Instagram Graph API Token",
    webhookUrl: "/api/webhooks/instagram",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: "Engage with potential leads from X/Twitter interactions",
    icon: IconBrandTwitter,
    status: "disconnected",
    category: "social",
    features: [
      "Monitor mentions",
      "Track DMs",
      "Auto-engage with prospects",
      "Lead identification",
    ],
    requiresApi: true,
    apiKeyLabel: "X API Bearer Token",
    webhookUrl: "/api/webhooks/twitter",
  },
  {
    id: "email",
    name: "Email Integration",
    description: "Connect your email to capture and respond to leads",
    icon: IconMail,
    status: "disconnected",
    category: "email",
    features: [
      "Email lead capture",
      "Automated responses",
      "Follow-up sequences",
      "Email analytics",
    ],
    requiresApi: true,
    apiKeyLabel: "SMTP Configuration",
    webhookUrl: "/api/webhooks/email",
  },
];

export function IntegrationsSettings() {
  const [apiKeys, setApiKeys] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});
  const [connectedIntegrations, setConnectedIntegrations] = React.useState<
    Set<string>
  >(new Set());

  // Load initial integration status
  React.useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const response = await fetch("/api/integrations/");
        if (response.ok) {
          const integrations = await response.json();
          const connected = new Set<string>();
          integrations.forEach(
            (integration: { id: string; status: string }) => {
              if (integration.status === "connected") {
                connected.add(integration.id);
              }
            }
          );
          setConnectedIntegrations(connected);
        }
      } catch (error) {
        console.error("Error loading integrations:", error);
      }
    };

    loadIntegrations();
  }, []);

  const handleApiKeyChange = (integrationId: string, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [integrationId]: value,
    }));
  };

  const handleConnect = async (integration: Integration) => {
    setLoading((prev) => ({ ...prev, [integration.id]: true }));

    try {
      const apiKey = apiKeys[integration.id];
      if (!apiKey) {
        alert("Please enter your API key first");
        setLoading((prev) => ({ ...prev, [integration.id]: false }));
        return;
      }

      // Prepare request based on integration type
      const endpoint = `/api/integrations/${integration.id}/connect`;
      let payload: Record<string, string | boolean> = {};

      if (integration.id === "calendly") {
        payload = {
          name: integration.name,
          enabled: true,
          access_token: apiKey,
          default_event_type: "Sales Call",
          timezone: "UTC",
        };
      } else if (integration.id === "whatsapp") {
        payload = {
          name: "WhatsApp Business",
          enabled: true,
          api_key: apiKey,
        };
      } else {
        // Generic payload for other integrations
        payload = {
          name: integration.name,
          enabled: true,
          api_key: apiKey,
        };
      }

      // Make actual API call to backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `Failed to connect ${integration.name}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // Handle validation errors
              errorMessage = errorData.detail
                .map(
                  (err: { loc?: string[]; msg: string }) =>
                    `${err.loc?.join(".")} - ${err.msg}`
                )
                .join(", ");
            } else if (typeof errorData.detail === "string") {
              errorMessage = errorData.detail;
            } else {
              errorMessage = JSON.stringify(errorData.detail);
            }
          }
        } catch {
          // If we can't parse the error response, use the status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        // Mark as connected
        setConnectedIntegrations((prev) => new Set([...prev, integration.id]));

        // Clear the API key input for security
        setApiKeys((prev) => ({
          ...prev,
          [integration.id]: "",
        }));

        console.log(`${integration.name} connected successfully:`, result);
      } else {
        throw new Error(
          result.message || `Failed to connect ${integration.name}`
        );
      }
    } catch (error) {
      console.error(`Error connecting ${integration.name}:`, error);
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = String(error);
      }
      alert(`Failed to connect ${integration.name}: ${errorMessage}`);
    } finally {
      setLoading((prev) => ({ ...prev, [integration.id]: false }));
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    setLoading((prev) => ({ ...prev, [integration.id]: true }));

    try {
      // Make API call to disconnect
      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = `Failed to disconnect ${integration.name}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // Handle validation errors
              errorMessage = errorData.detail
                .map(
                  (err: { loc?: string[]; msg: string }) =>
                    `${err.loc?.join(".")} - ${err.msg}`
                )
                .join(", ");
            } else if (typeof errorData.detail === "string") {
              errorMessage = errorData.detail;
            } else {
              errorMessage = JSON.stringify(errorData.detail);
            }
          }
        } catch {
          // If we can't parse the error response, use the status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        // Mark as disconnected
        setConnectedIntegrations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(integration.id);
          return newSet;
        });

        console.log(`${integration.name} disconnected successfully`);
      } else {
        throw new Error(
          result.message || `Failed to disconnect ${integration.name}`
        );
      }
    } catch (error) {
      console.error(`Error disconnecting ${integration.name}:`, error);
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = String(error);
      }
      alert(`Failed to disconnect ${integration.name}: ${errorMessage}`);
    } finally {
      setLoading((prev) => ({ ...prev, [integration.id]: false }));
    }
  };

  const getCategoryColor = (category: Integration["category"]) => {
    switch (category) {
      case "calendar":
        return "text-blue-600";
      case "social":
        return "text-purple-600";
      case "messaging":
        return "text-green-600";
      case "email":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <IconSettings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Integrations
          </h2>
          <p className="text-muted-foreground">
            Connect your favorite platforms to automate lead management
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <IconPlug className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Total Integrations</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{integrations.length}</span>
              <span className="text-muted-foreground text-sm ml-1">
                available
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <IconCheck className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Connected</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">
                {connectedIntegrations.size}
              </span>
              <span className="text-muted-foreground text-sm ml-1">active</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <IconShield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Security</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-green-600">Secure</span>
              <span className="text-muted-foreground text-sm ml-1">
                encrypted
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Integrations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isConnected = connectedIntegrations.has(integration.id);
          const isLoading = loading[integration.id];

          return (
            <Card key={integration.id} className="relative">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${getCategoryColor(
                        integration.category
                      )} bg-current/10`}
                    >
                      <Icon
                        className={`h-5 w-5 ${getCategoryColor(
                          integration.category
                        )}`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {integration.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {integration.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features List - Only show when not connected */}
                {!isConnected && (
                  <div>
                    <Label className="text-sm font-medium">Features:</Label>
                    <ul className="mt-2 space-y-1">
                      {integration.features
                        .slice(0, 3)
                        .map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      {integration.features.length > 3 && (
                        <li className="text-sm text-muted-foreground">
                          +{integration.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* API Key Input - Only show when not connected */}
                {integration.requiresApi && !isConnected && (
                  <div className="space-y-2">
                    <Label
                      htmlFor={`api-key-${integration.id}`}
                      className="text-sm"
                    >
                      {integration.apiKeyLabel}
                    </Label>
                    <Input
                      id={`api-key-${integration.id}`}
                      type="password"
                      placeholder="Enter your API key or token"
                      value={apiKeys[integration.id] || ""}
                      onChange={(e) =>
                        handleApiKeyChange(integration.id, e.target.value)
                      }
                    />
                  </div>
                )}

                {/* Success message when connected */}
                {isConnected && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-green-600 font-medium">
                      <IconCheck className="h-5 w-5" />
                      Integration successfully configured
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {integration.name} is now connected and ready to receive
                      leads
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-2">
                {isConnected ? (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleDisconnect(integration)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Disconnecting..."
                    ) : (
                      <>
                        <IconCheck className="h-4 w-4 mr-2" />
                        Connected
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={() => handleConnect(integration)}
                    disabled={
                      isLoading ||
                      (integration.requiresApi && !apiKeys[integration.id])
                    }
                  >
                    {isLoading ? "Connecting..." : "Connect"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            All API keys and tokens are encrypted and stored securely. We use
            industry-standard security practices to protect your integrations
            and data.
          </p>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Auto-sync data</Label>
              <p className="text-xs text-muted-foreground">
                Automatically sync lead data from connected platforms
              </p>
            </div>
            <Checkbox defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Real-time notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified when new leads are captured
              </p>
            </div>
            <Checkbox defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
