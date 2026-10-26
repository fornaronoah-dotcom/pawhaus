import { CartProvider } from "@/components/cart/cart-context";
import { FavoritesProvider } from "@/components/favorites/favorites-context";
import { CartDrawer } from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { getCart } from "@/lib/cart";
import { isCustomerAccountsConfigured } from "@/lib/customer/config";
import { getCustomerSession } from "@/lib/customer/session";
import { getFavorites } from "@/lib/favorites";

/**
 * Layout voor de publieke webshop. Bevat de winkel-chrome (Header, Footer,
 * winkelmand, favorieten). Het admin-paneel (app/admin) valt hier bewust
 * BUITEN en heeft zijn eigen layout.
 */
export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cart = await getCart();
  const session = await getCustomerSession();
  const isAuthed = Boolean(session);
  const initialFavorites = session ? await getFavorites(session.customerId) : [];

  return (
    <CartProvider initialCart={cart}>
      <FavoritesProvider initialFavorites={initialFavorites} isAuthed={isAuthed}>
        <AnnouncementBar />
        <Header
          isAuthed={isAuthed}
          accountsEnabled={isCustomerAccountsConfigured}
        />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </FavoritesProvider>
    </CartProvider>
  );
}
