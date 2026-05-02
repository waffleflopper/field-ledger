export type SignedUploadUrl = {
  signedUrl: string;
  token: string;
  path: string;
};

export type CreateSignedUploadUrlOptions = {
  expiresIn?: number;
};

export type StoragePort = {
  createSignedUploadUrl(
    path: string,
    options?: CreateSignedUploadUrlOptions,
  ): Promise<SignedUploadUrl>;
  createSignedDownloadUrl(path: string, expiresIn?: number): Promise<string>;
};

export function createUnavailableStoragePort(): StoragePort {
  return {
    async createSignedUploadUrl() {
      throw new Error("A file storage provider is required.");
    },
    async createSignedDownloadUrl() {
      throw new Error("A file storage provider is required.");
    },
  };
}

export {
  createStoragePortFromEnvironment,
  createSupabaseStorageAdapter,
} from "./supabase-storage-adapter";
