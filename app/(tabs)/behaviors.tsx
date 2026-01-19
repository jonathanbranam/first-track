/**
 * Behavior Tracking screen - for viewing and logging behaviors
 */

import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuickLogFAB } from '@/components/behaviors/quick-log-fab';
import { BehaviorHistoryModal } from '@/components/behaviors/behavior-history-modal';
import { useBehaviors, useBehaviorLogs } from '@/hooks/use-behaviors';
import { useQuickLog } from '@/contexts/quick-log-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BehaviorLog } from '@/types/behavior';

export default function BehaviorsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const tintContrastColor = colors.background;

  const { activeBehaviors, loading: behaviorsLoading } = useBehaviors();
  const { logs, loading: logsLoading, deleteLog, getDailyTotal } = useBehaviorLogs();
  const { showQuickLog } = useQuickLog();

  const [showHistory, setShowHistory] = useState(false);

  // Get today's date range
  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, []);

  const todayEnd = useMemo(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  }, []);

  // Filter today's logs
  const todayLogs = useMemo(() => {
    return logs.filter((log) => log.timestamp >= todayStart && log.timestamp <= todayEnd);
  }, [logs, todayStart, todayEnd]);

  // Group logs by behavior
  const logsByBehavior = useMemo(() => {
    const grouped: Record<string, BehaviorLog[]> = {};
    todayLogs.forEach((log) => {
      if (!grouped[log.behaviorId]) {
        grouped[log.behaviorId] = [];
      }
      grouped[log.behaviorId].push(log);
    });
    return grouped;
  }, [todayLogs]);

  const handleDeleteLog = (log: BehaviorLog) => {
    const behavior = activeBehaviors.find((b) => b.id === log.behaviorId);
    const behaviorName = behavior?.name || 'behavior';

    Alert.alert(
      'Delete Log',
      `Are you sure you want to delete this ${behaviorName} log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteLog(log.id),
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderBehaviorCard = (behavior: typeof activeBehaviors[0]) => {
    const behaviorLogs = logsByBehavior[behavior.id] || [];
    const dailyTotal = getDailyTotal(behavior.id, new Date());
    const logCount = behaviorLogs.length;

    return (
      <View
        key={behavior.id}
        style={[
          styles.behaviorCard,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}>
        <View style={styles.behaviorHeader}>
          <View style={styles.behaviorInfo}>
            <Text style={[styles.behaviorName, { color: colors.text }]}>{behavior.name}</Text>
            <Text style={[styles.behaviorMeta, { color: colors.icon }]}>
              {behavior.type} • {behavior.units}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.quickLogButton, { backgroundColor: colors.tint }]}
            onPress={showQuickLog}
            testID={`quick-log-${behavior.id}`}>
            <IconSymbol name="plus" size={20} color={tintContrastColor} />
            <Text style={[styles.quickLogButtonText, { color: tintContrastColor }]}>Log</Text>
          </TouchableOpacity>
        </View>

        {dailyTotal > 0 && (
          <View style={[styles.dailyTotal, { backgroundColor: colors.tint + '10' }]}>
            <Text style={[styles.dailyTotalText, { color: colors.tint }]}>
              Today's Total: {dailyTotal} {behavior.units}
            </Text>
            {logCount > 1 && (
              <Text style={[styles.logCount, { color: colors.icon }]}>
                ({logCount} {logCount === 1 ? 'entry' : 'entries'})
              </Text>
            )}
          </View>
        )}

        {behaviorLogs.length > 0 && (
          <View style={styles.logsSection}>
            <Text style={[styles.logsSectionTitle, { color: colors.icon }]}>Today's Logs</Text>
            {behaviorLogs
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((log) => (
                <View
                  key={log.id}
                  style={[
                    styles.logItem,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}>
                  <View style={styles.logInfo}>
                    <Text style={[styles.logTime, { color: colors.icon }]}>
                      {formatTime(log.timestamp)}
                    </Text>
                    <View style={styles.logDetails}>
                      <Text style={[styles.logQuantity, { color: colors.text }]}>
                        {log.quantity} {behavior.units}
                      </Text>
                      {log.weight && (
                        <Text style={[styles.logWeight, { color: colors.icon }]}>
                          @ {log.weight} {behavior.units}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteLog(log)}
                    testID={`delete-log-${log.id}`}>
                    <IconSymbol name="trash" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        )}

        {behaviorLogs.length === 0 && (
          <View style={styles.noLogs}>
            <Text style={[styles.noLogsText, { color: colors.icon }]}>
              No logs today. Tap Log to add one.
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (behaviorsLoading || logsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <ThemedText type="title">Behaviors</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.icon }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Behaviors</ThemedText>
        {activeBehaviors.length > 0 && (
          <TouchableOpacity
            style={[styles.historyButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowHistory(true)}
            testID="view-history-button">
            <IconSymbol name="clock" size={20} color={tintContrastColor} />
            <Text style={[styles.historyButtonText, { color: tintContrastColor }]}>History</Text>
          </TouchableOpacity>
        )}
      </View>

      {activeBehaviors.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="checklist" size={64} color={colors.icon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Behaviors</Text>
          <Text style={[styles.emptyMessage, { color: colors.icon }]}>
            Create behaviors in Settings to start tracking
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {todayLogs.length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: colors.tint + '10' }]}>
              <Text style={[styles.summaryTitle, { color: colors.tint }]}>Today's Summary</Text>
              <Text style={[styles.summaryText, { color: colors.text }]}>
                {todayLogs.length} {todayLogs.length === 1 ? 'activity' : 'activities'} logged
                across {Object.keys(logsByBehavior).length}{' '}
                {Object.keys(logsByBehavior).length === 1 ? 'behavior' : 'behaviors'}
              </Text>
            </View>
          )}

          {activeBehaviors.map(renderBehaviorCard)}
        </ScrollView>
      )}

      <QuickLogFAB />
      <BehaviorHistoryModal visible={showHistory} onClose={() => setShowHistory(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
  },
  behaviorCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  behaviorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  behaviorInfo: {
    flex: 1,
  },
  behaviorName: {
    fontSize: 18,
    fontWeight: '600',
  },
  behaviorMeta: {
    fontSize: 14,
    marginTop: 4,
  },
  quickLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  quickLogButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dailyTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dailyTotalText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logCount: {
    fontSize: 14,
  },
  logsSection: {
    marginTop: 8,
  },
  logsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  logInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logTime: {
    fontSize: 14,
    minWidth: 60,
  },
  logDetails: {
    flex: 1,
  },
  logQuantity: {
    fontSize: 16,
    fontWeight: '500',
  },
  logWeight: {
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  noLogs: {
    padding: 20,
    alignItems: 'center',
  },
  noLogsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
