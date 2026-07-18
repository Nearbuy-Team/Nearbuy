import { Redirect, Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useAuth } from '@/lib/AuthContext';

export default function TabsLayout() {
  const { token, isLoading } = useAuth();

  // Protect the logged-in experience — bounce to login when there's no token.
  if (!isLoading && !token) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
