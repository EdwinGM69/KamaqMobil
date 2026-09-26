import { Tabs } from "expo-router";
import { Icon } from "@/shared/components/ui/Icon";

const TAB_ICONS: Record<string, string> = {
  index: "home",
  sales: "point_of_sale",
  inventory: "inventory_2",
  customers: "group",
  cash: "account_balance_wallet",
};

const ACTIVE = "#0A84FF";
const INACTIVE = "#8E8E93";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="sales"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: "#1E1E1E",
          borderTopColor: "#333333",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={TAB_ICONS.index}
              size={24}
              color={color}
              weight={focused ? 700 : 400}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Ventas",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={TAB_ICONS.sales}
              size={24}
              color={color}
              weight={focused ? 700 : 400}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Stock",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={TAB_ICONS.inventory}
              size={24}
              color={color}
              weight={focused ? 700 : 400}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={TAB_ICONS.customers}
              size={24}
              color={color}
              weight={focused ? 700 : 400}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cash"
        options={{
          title: "Caja",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name={TAB_ICONS.cash}
              size={24}
              color={color}
              weight={focused ? 700 : 400}
            />
          ),
        }}
      />
    </Tabs>
  );
}