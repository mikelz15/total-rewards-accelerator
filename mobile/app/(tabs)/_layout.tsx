import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={20} style={{ marginBottom: -2 }} name={props.name} color={props.color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.tabIconSelected,
        tabBarInactiveTintColor: c.tabIconDefault,
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.border,
        },
        headerStyle: { backgroundColor: c.card },
        headerTintColor: c.text,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="cleaner"
        options={{
          title: "Cleaner",
          tabBarIcon: ({ color }) => <TabBarIcon name="database" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="auditor"
        options={{
          title: "Equity",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="balance-scale" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="candidates"
        options={{
          title: "Tracker",
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="closer"
        options={{
          title: "Closer",
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
