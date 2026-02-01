import { getSecretItems } from "@/app/actions";
import { SecretView } from "@/components/secret/secret-view";

export default async function SecretPage() {
  const items = await getSecretItems();
  return <SecretView items={items} />;
}