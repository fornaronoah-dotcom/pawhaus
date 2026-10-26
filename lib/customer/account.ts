import "server-only";

import { customerAccountFetch } from "@/lib/customer/api";
import {
  ADDRESS_CREATE_MUTATION,
  ADDRESS_DELETE_MUTATION,
  ADDRESS_UPDATE_MUTATION,
  CUSTOMER_ADDRESSES_QUERY,
  CUSTOMER_ORDERS_QUERY,
  CUSTOMER_PROFILE_QUERY,
  CUSTOMER_UPDATE_MUTATION,
} from "@/lib/customer/queries";

/**
 * Getypte wrappers rond de Customer Account API. Alle lees-functies vangen
 * fouten af en geven een veilige lege waarde terug, zodat de account-pagina's
 * niet hard crashen wanneer de creds nog ontbreken of het schema afwijkt.
 */

export type CustomerProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  marketingSubscribed: boolean;
  phone: string | null;
};

export type Money = { amount: string; currencyCode: string };

export type OrderLineItem = {
  name: string;
  quantity: number;
  variantId: string | null;
  imageUrl: string | null;
  price: Money | null;
};

export type CustomerOrder = {
  id: string;
  name: string;
  number: number;
  processedAt: string;
  financialStatus: string | null;
  totalPrice: Money | null;
  lineItems: OrderLineItem[];
};

export type CustomerAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  zoneCode: string | null;
  territoryCode: string | null;
  zip: string | null;
  phoneNumber: string | null;
  formatted: string[];
  isDefault: boolean;
};

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  try {
    const data = await customerAccountFetch<{
      customer: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
        emailAddress: { emailAddress: string | null; marketingState: string | null } | null;
        phoneNumber: { phoneNumber: string | null } | null;
      };
    }>(CUSTOMER_PROFILE_QUERY);

    const c = data.customer;
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      displayName: c.displayName,
      email: c.emailAddress?.emailAddress ?? null,
      marketingSubscribed: c.emailAddress?.marketingState === "SUBSCRIBED",
      phone: c.phoneNumber?.phoneNumber ?? null,
    };
  } catch (err) {
    console.error("[customer] profiel ophalen mislukt:", err);
    return null;
  }
}

export async function getCustomerOrders(first = 25): Promise<CustomerOrder[]> {
  try {
    const data = await customerAccountFetch<{
      customer: {
        orders: {
          nodes: Array<{
            id: string;
            name: string;
            number: number;
            processedAt: string;
            financialStatus: string | null;
            totalPrice: Money | null;
            lineItems: {
              nodes: Array<{
                name: string;
                quantity: number;
                variantId: string | null;
                image: { url: string | null } | null;
                price: Money | null;
              }>;
            };
          }>;
        };
      };
    }>(CUSTOMER_ORDERS_QUERY, { first });

    return data.customer.orders.nodes.map((o) => ({
      id: o.id,
      name: o.name,
      number: o.number,
      processedAt: o.processedAt,
      financialStatus: o.financialStatus,
      totalPrice: o.totalPrice,
      lineItems: o.lineItems.nodes.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        variantId: l.variantId,
        imageUrl: l.image?.url ?? null,
        price: l.price,
      })),
    }));
  } catch (err) {
    console.error("[customer] bestellingen ophalen mislukt:", err);
    return [];
  }
}

export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  try {
    const data = await customerAccountFetch<{
      customer: {
        defaultAddress: { id: string } | null;
        addresses: {
          nodes: Array<Omit<CustomerAddress, "isDefault">>;
        };
      };
    }>(CUSTOMER_ADDRESSES_QUERY);

    const defaultId = data.customer.defaultAddress?.id ?? null;
    return data.customer.addresses.nodes.map((a) => ({
      ...a,
      isDefault: a.id === defaultId,
    }));
  } catch (err) {
    console.error("[customer] adressen ophalen mislukt:", err);
    return [];
  }
}

export type AddressInput = {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  zoneCode?: string;
  territoryCode?: string;
  zip?: string;
  phoneNumber?: string;
};

type UserErrors = { userErrors: Array<{ message: string }> };

function firstError(errs: Array<{ message: string }>): string | null {
  return errs[0]?.message ?? null;
}

export async function updateCustomerName(
  firstName: string,
  lastName: string,
): Promise<{ ok: boolean; error?: string }> {
  const data = await customerAccountFetch<{ customerUpdate: UserErrors }>(
    CUSTOMER_UPDATE_MUTATION,
    { input: { firstName, lastName } },
  );
  const err = firstError(data.customerUpdate.userErrors);
  return err ? { ok: false, error: err } : { ok: true };
}

export async function createAddress(
  address: AddressInput,
  setDefault: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const data = await customerAccountFetch<{ customerAddressCreate: UserErrors }>(
    ADDRESS_CREATE_MUTATION,
    { address, defaultAddress: setDefault },
  );
  const err = firstError(data.customerAddressCreate.userErrors);
  return err ? { ok: false, error: err } : { ok: true };
}

export async function updateAddress(
  addressId: string,
  address: AddressInput,
  setDefault: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const data = await customerAccountFetch<{ customerAddressUpdate: UserErrors }>(
    ADDRESS_UPDATE_MUTATION,
    { addressId, address, defaultAddress: setDefault },
  );
  const err = firstError(data.customerAddressUpdate.userErrors);
  return err ? { ok: false, error: err } : { ok: true };
}

export async function deleteAddress(
  addressId: string,
): Promise<{ ok: boolean; error?: string }> {
  const data = await customerAccountFetch<{ customerAddressDelete: UserErrors }>(
    ADDRESS_DELETE_MUTATION,
    { addressId },
  );
  const err = firstError(data.customerAddressDelete.userErrors);
  return err ? { ok: false, error: err } : { ok: true };
}
