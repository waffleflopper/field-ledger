import { HandReceiptDetail } from "@/modules/hand-receipts/ui/hand-receipt-detail";

type HandReceiptDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HandReceiptDetailPage({
  params,
}: HandReceiptDetailPageProps) {
  const { id } = await params;

  return <HandReceiptDetail handReceiptId={id} />;
}
