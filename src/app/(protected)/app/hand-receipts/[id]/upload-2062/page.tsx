import { Upload2062Flow } from "@/modules/assignments-2062/ui/upload-2062-flow";

type HandReceiptUpload2062PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HandReceiptUpload2062Page({
  params,
}: HandReceiptUpload2062PageProps) {
  const { id } = await params;

  return <Upload2062Flow handReceiptId={id} />;
}
