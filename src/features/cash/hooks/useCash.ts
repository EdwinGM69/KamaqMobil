import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import {
  cashRepo,
  type CashSession,
  type CashMovement,
} from "@/infrastructure/database/repositories/cash.repo";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCashStore } from "@/stores/useCashStore";

export function useCash() {
  const db = useSQLiteContext();
  const user = useAuthStore((state) => state.user);
  const { currentSessionId } = useCashStore();

  const openSession = useQuery({
    queryKey: ["cash", "open", user?.id],
    queryFn: () =>
      user ? cashRepo.getOpenSession(db, user.id) : Promise.resolve(null),
    enabled: !!user,
  });

  const session = useQuery<CashSession | null>({
    queryKey: ["cash", "session", currentSessionId],
    queryFn: () =>
      currentSessionId
        ? cashRepo.getSessionById(db, currentSessionId)
        : Promise.resolve(null),
    enabled: !!currentSessionId,
  });

  const movements = useQuery<CashMovement[]>({
    queryKey: ["cash", "movements", currentSessionId],
    queryFn: () =>
      currentSessionId
        ? cashRepo.getMovements(db, currentSessionId)
        : Promise.resolve([]),
    enabled: !!currentSessionId,
  });

  const salesTotal = useQuery({
    queryKey: ["cash", "salesTotal", currentSessionId],
    queryFn: () =>
      currentSessionId
        ? cashRepo.getSalesTotal(db, currentSessionId)
        : Promise.resolve(0),
    enabled: !!currentSessionId,
  });

  const expensesTotal = useQuery({
    queryKey: ["cash", "expensesTotal", currentSessionId],
    queryFn: () =>
      currentSessionId
        ? cashRepo.getExpensesTotal(db, currentSessionId)
        : Promise.resolve(0),
    enabled: !!currentSessionId,
  });

  const paymentTotals = useQuery({
    queryKey: ["cash", "paymentTotals", currentSessionId],
    queryFn: () =>
      currentSessionId
        ? cashRepo.getSessionTotals(db, currentSessionId)
        : Promise.resolve({ total: 0, cash: 0, card: 0, yape: 0, count: 0 }),
    enabled: !!currentSessionId,
  });

  return {
    openSession: openSession.data,
    session: session.data,
    movements: movements.data ?? [],
    salesTotal: salesTotal.data ?? 0,
    expensesTotal: expensesTotal.data ?? 0,
    paymentTotals: paymentTotals.data ?? { total: 0, cash: 0, card: 0, yape: 0, count: 0 },
    openingAmount: session.data?.opening_amount ?? 0,
    isOpen: !!currentSessionId,
    currentSessionId,
    isLoading: movements.isLoading,
  };
}

export function useOpenCash() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setSession = useCashStore((state) => state.setSession);

  return useMutation({
    mutationFn: ({
      openingAmount,
      observation,
      equipment,
    }: {
      openingAmount: number;
      observation: string;
      equipment: { printer: boolean; scanner: boolean; internet: boolean };
    }) => {
      if (!user) throw new Error("No user");
      return cashRepo.openSession(
        db,
        user.id,
        openingAmount,
        observation,
        equipment
      );
    },
    onSuccess: (sessionId, variables) => {
      setSession(sessionId, variables.openingAmount);
      queryClient.invalidateQueries({ queryKey: ["cash"] });
    },
  });
}

export function useCloseCash() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const closeSession = useCashStore((state) => state.closeSession);

  return useMutation({
    mutationFn: ({
      sessionId,
      closingAmount,
      expectedAmount,
    }: {
      sessionId: number;
      closingAmount: number;
      expectedAmount: number;
    }) => {
      const difference = closingAmount - expectedAmount;
      return cashRepo.closeSession(
        db,
        sessionId,
        closingAmount,
        expectedAmount,
        difference
      );
    },
    onSuccess: () => {
      closeSession();
      queryClient.invalidateQueries({ queryKey: ["cash"] });
    },
  });
}

export function useRegisterExpense() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const currentSessionId = useCashStore((state) => state.currentSessionId);

  return useMutation({
    mutationFn: ({
      amount,
      description,
    }: {
      amount: number;
      description: string;
    }) => {
      if (!currentSessionId) throw new Error("No active session");
      return cashRepo.addMovement(
        db,
        currentSessionId,
        "expense",
        -Math.abs(amount),
        description
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash"] });
    },
  });
}
