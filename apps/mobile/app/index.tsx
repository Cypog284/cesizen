import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';

export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fffe' }}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)' : '/(auth)/login'} />;
}
