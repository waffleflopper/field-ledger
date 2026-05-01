import { ItemDetail } from "@/modules/items/ui/item-detail";

type ItemDetailPageProps = {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
};

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id, itemId } = await params;

  return <ItemDetail handReceiptId={id} itemId={itemId} />;
}
