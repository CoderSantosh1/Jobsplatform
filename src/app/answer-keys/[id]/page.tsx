import type { Metadata } from "next";
import SimpleDetail from "@/components/seo/SimpleDetail";
import { detailMetadata } from "@/lib/seo-server";

export const revalidate = 300;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return detailMetadata("answer-keys", (await params).id);
}

export default async function Page({ params }: Props) {
  return <SimpleDetail section="answer-keys" param={(await params).id} />;
}
