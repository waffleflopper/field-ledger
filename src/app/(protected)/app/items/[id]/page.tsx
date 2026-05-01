import { ItemGlobalDetail } from "@/modules/items/ui/item-global-detail";

type ItemGlobalDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ItemGlobalDetailPage({
  params,
}: ItemGlobalDetailPageProps) {
  const { id } = await params;

  return <ItemGlobalDetail itemId={id} />;
}
