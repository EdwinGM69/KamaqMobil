import { useQuery } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { customersRepo, type Customer } from "@/infrastructure/database/repositories/customers.repo";

export function useCustomers(search?: string) {
  const db = useSQLiteContext();

  const query = useQuery<Customer[]>({
    queryKey: ["customers", search ?? "all"],
    queryFn: () =>
      search && search.length > 0
        ? customersRepo.search(db, search)
        : customersRepo.getAll(db),
  });

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useCustomer(id?: number) {
  const db = useSQLiteContext();

  return useQuery<Customer | null>({
    queryKey: ["customer", id],
    queryFn: () => (id ? customersRepo.getById(db, id) : null),
    enabled: !!id,
  });
}

export function useDebtors() {
  const db = useSQLiteContext();

  return useQuery<Customer[]>({
    queryKey: ["debtors"],
    queryFn: () => customersRepo.getWithDebt(db),
  });
}
