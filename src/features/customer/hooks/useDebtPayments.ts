import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { debtPaymentsRepo } from "@/infrastructure/database/repositories/debtPayments.repo";
import { customersRepo } from "@/infrastructure/database/repositories/customers.repo";
import { cashRepo } from "@/infrastructure/database/repositories/cash.repo";
import { useCashStore } from "@/stores/useCashStore";
import type { DebtPayment } from "@/infrastructure/database/repositories/debtPayments.repo";

export function useCustomerPayments(customerId?: number) {
  const db = useSQLiteContext();

  const payments = useQuery<DebtPayment[]>({
    queryKey: ["debtPayments", customerId],
    queryFn: () =>
      customerId
        ? debtPaymentsRepo.getByCustomer(db, customerId)
        : Promise.resolve([]),
    enabled: !!customerId,
  });

  return {
    payments: payments.data ?? [],
    isLoading: payments.isLoading,
  };
}

export function useRegisterPayment() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const currentSessionId = useCashStore((state) => state.currentSessionId);
  const addMovement = useCashStore((state) => state.addMovement);

  return useMutation({
    mutationFn: ({
      customerId,
      amount,
      method,
      notes,
    }: {
      customerId: number;
      amount: number;
      method: string;
      notes?: string;
    }) =>
      debtPaymentsRepo.create(db, {
        customer_id: customerId,
        amount,
        payment_method: method,
        notes,
      }),
    onSuccess: async (paymentId, variables) => {
      const customer = await customersRepo.getById(db, variables.customerId);
      if (customer && currentSessionId) {
        await cashRepo.addMovement(
          db,
          currentSessionId,
          "sale",
          variables.amount,
          `Pago de deuda - ${customer.name}`,
          paymentId,
          "debt_payment"
        );
      }
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debtors"] });
      queryClient.invalidateQueries({ queryKey: ["debtPayments"] });
      queryClient.invalidateQueries({ queryKey: ["cash"] });
    },
  });
}
