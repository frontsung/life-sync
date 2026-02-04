import { SecretView } from "@/components/secret/secret-view";
// import { getSecretItems } from "@/app/actions"; // Removed import

export default async function SecretPage() {
  // const secretItems = await getSecretItems(); // Removed call

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <SecretView /* secretItems={secretItems} */ />
    </div>
  );
}