import type {
  CreateSignedUploadUrlOptions,
  SignedUploadUrl,
  StoragePort,
} from "@/modules/provider-boundaries/storage";

export class MockStoragePort implements StoragePort {
  uploadCalls: Array<{ path: string; options?: CreateSignedUploadUrlOptions }> =
    [];
  downloadCalls: Array<{ path: string; expiresIn?: number }> = [];
  failUploads = false;
  failDownloads = false;

  async createSignedUploadUrl(
    path: string,
    options?: CreateSignedUploadUrlOptions,
  ): Promise<SignedUploadUrl> {
    this.uploadCalls.push(options === undefined ? { path } : { path, options });

    if (this.failUploads) {
      throw new Error("Storage upload URL was not created.");
    }

    return {
      signedUrl: `https://storage.test/upload/${path}`,
      token: `token-${path}`,
      path,
    };
  }

  async createSignedDownloadUrl(path: string, expiresIn?: number) {
    this.downloadCalls.push(
      expiresIn === undefined ? { path } : { path, expiresIn },
    );

    if (this.failDownloads) {
      throw new Error("Storage download URL was not created.");
    }

    return `https://storage.test/download/${path}`;
  }
}
