import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

/**
 * Layout untuk halaman utama (landing `/` dan `/test`) yang membutuhkan
 * Navbar dan Footer global.
 *
 * ThemeProvider sudah disertakan di root layout — tidak perlu duplikat di sini.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full flex-1 overflow-x-hidden px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
