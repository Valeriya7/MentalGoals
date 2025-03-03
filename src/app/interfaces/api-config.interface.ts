export interface GarminConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  redirectUri: string;
}

export interface SamsungHealthConfig {
  clientId: string;
  clientSecret: string;
  packageName: string;
}

export interface AppleHealthConfig {
  bundleId: string;
  teamId: string;
} 