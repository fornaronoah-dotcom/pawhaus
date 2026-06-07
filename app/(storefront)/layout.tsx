import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCart } from "@/lib/cart";

/**
 * Layout voor de publieke webshop. Bevat de winkel-chrome (Header, Footer,
 * winkelmand). Het admin-paneel (app/admin) valt hier bewust BUITEN en heeft
 * zijn eigen layout.
 */
export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cart = await getCart();

  return (
    <CartProvider initialCart={cart}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
