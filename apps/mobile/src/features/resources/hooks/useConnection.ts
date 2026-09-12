import { useNetInfo } from '@react-native-community/netinfo';
export function useConnection() {
  const network = useNetInfo();
  return { offline: network.isConnected === false || network.isInternetReachable === false };
}
