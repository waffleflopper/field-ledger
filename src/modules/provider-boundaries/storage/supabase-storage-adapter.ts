import { createClient } from "@supabase/supabase-js";

import type { StoragePort } from ".";

const DOCUMENTS_BUCKET = "documents";

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for Supabase Storage.`);
  }

  return value;
}

export function createSupabaseStorageAdapter(): StoragePort {
  const supabaseUrl = readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return {
    async createSignedUploadUrl(path) {
      const { data, error } = await client.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUploadUrl(path, {
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      return {
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path,
      };
    },
    async createSignedDownloadUrl(path, expiresIn = 60 * 10) {
      const { data, error } = await client.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw new Error(error.message);
      }

      return data.signedUrl;
    },
  };
}

export function createStoragePortFromEnvironment(): StoragePort {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      async createSignedUploadUrl() {
        throw new Error("A file storage provider is required.");
      },
      async createSignedDownloadUrl() {
        throw new Error("A file storage provider is required.");
      },
    };
  }

  return createSupabaseStorageAdapter();
}
