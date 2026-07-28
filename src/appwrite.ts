import { Client, Account, Databases, Storage } from "appwrite";

const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || "6a63067b002ee28acaef";

export const client = new Client();

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_CONFIG = {
  endpoint: APPWRITE_ENDPOINT,
  projectId: APPWRITE_PROJECT_ID,
  projectName: import.meta.env.VITE_APPWRITE_PROJECT_NAME || "Zero air",
};
