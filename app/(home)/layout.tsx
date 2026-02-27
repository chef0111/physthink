import { Header } from '@/modules/home/header';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto">
      <Header />
      {children}
    </main>
  );
}
