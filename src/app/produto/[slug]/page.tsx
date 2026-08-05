import type { Metadata } from "next";
import ProductByParamPage, {
  generateMetadata as genMeta,
} from "@/app/produtos/[id]/page";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return genMeta({ params: Promise.resolve({ slug }) });
}

export default async function ProductSlugPage({ params }: Props) {
  const { slug } = await params;
  return ProductByParamPage({ params: Promise.resolve({ slug }) });
}
