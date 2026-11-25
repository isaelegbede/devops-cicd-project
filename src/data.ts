export type ServiceState = "Operational" | "Degraded" | "Maintenance";

export type Service = {
  name: string;
  team: string;
  region: string;
  uptime: string;
  latency: string;
  state: ServiceState;
};

export const services: Service[] = [
  {
    name: "Web experience",
    team: "Digital",
    region: "us-east-1",
    uptime: "99.99%",
    latency: "84 ms",
    state: "Operational",
  },
  {
    name: "Payments API",
    team: "Commerce",
    region: "us-east-1",
    uptime: "99.95%",
    latency: "128 ms",
    state: "Operational",
  },
  {
    name: "Identity platform",
    team: "Security",
    region: "eu-west-1",
    uptime: "99.82%",
    latency: "246 ms",
    state: "Degraded",
  },
  {
    name: "Analytics pipeline",
    team: "Data",
    region: "us-west-2",
    uptime: "99.98%",
    latency: "—",
    state: "Maintenance",
  },
];

export const releases = [
  { app: "web-experience", version: "v2.18.0", environment: "Production", time: "12 min ago", initials: "MK" },
  { app: "payments-api", version: "v4.6.2", environment: "Production", time: "48 min ago", initials: "AL" },
  { app: "identity-platform", version: "v1.12.1", environment: "Staging", time: "2 hr ago", initials: "JT" },
];
