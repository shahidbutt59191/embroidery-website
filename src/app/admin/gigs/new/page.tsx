import GigForm from "./GigForm";

export const dynamic = "force-dynamic";

export default function NewGigPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-outfit text-primary">Create New Gig</h1>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-border">
        <GigForm />
      </div>
    </div>
  );
}
