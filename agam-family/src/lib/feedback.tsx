import React, { createContext, useContext, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';

type FeedbackApi = {
  tap: () => void;
  success: () => void;
  alert: () => void;
};

const FeedbackContext = createContext<FeedbackApi>({ tap: () => {}, success: () => {}, alert: () => {} });

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const tapPlayer = useAudioPlayer(require('../../assets/sfx/tap.wav'));
  const successPlayer = useAudioPlayer(require('../../assets/sfx/success.wav'));
  const alertPlayer = useAudioPlayer(require('../../assets/sfx/alert.wav'));

  const value = useMemo<FeedbackApi>(() => {
    const play = async (player: any) => {
      try { await player.seekTo(0); player.play(); } catch {}
    };
    return {
      tap: () => {
        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
        play(tapPlayer);
      },
      success: () => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        play(successPlayer);
      },
      alert: () => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        play(alertPlayer);
      },
    };
  }, [tapPlayer, successPlayer, alertPlayer]);

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export const useFeedback = () => useContext(FeedbackContext);
