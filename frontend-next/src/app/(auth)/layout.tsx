import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-au-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/au-logo.png" alt="African Union" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-au-gold">AU Central Reporting System</h1>
          <p className="text-white/50 text-sm mt-1">Data Intelligence Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
