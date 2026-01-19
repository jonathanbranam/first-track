/**
 * Behavior History Modal - displays historical behavior logs with filtering and analytics
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Text,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useBehaviors, useBehaviorLogs } from '@/hooks/use-behaviors';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Behavior, BehaviorLog } from '@/types/behavior';

interface BehaviorHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

type DateRangeOption = 'today' | 'week' | 'month' | 'all' | 'custom';

interface AggregateStats {
  total: number;
  count: number;
  average: number;
  min: number;
  max: number;
}

export function BehaviorHistoryModal({ visible, onClose }: BehaviorHistoryModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { behaviors } = useBehaviors();
  const { logs, deleteLog, updateLog } = useBehaviorLogs();

  const [dateRange, setDateRange] = useState<DateRangeOption>('week');
  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLog, setEditingLog] = useState<BehaviorLog | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editWeight, setEditWeight] = useState('');

  // Calculate date range boundaries
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start = new Date(now);
    start.setHours(0, 0, 0, 0);

    switch (dateRange) {
      case 'today':
        // already set correctly
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setDate(now.getDate() - 30);
        break;
      case 'all':
        start = new Date(0); // beginning of time
        break;
    }

    return { startDate: start.getTime(), endDate: end.getTime() };
  }, [dateRange]);

  // Filter logs by date range, behavior, and search query
  const filteredLogs = useMemo(() => {
    let filtered = logs.filter((log) => log.timestamp >= startDate && log.timestamp <= endDate);

    if (selectedBehaviorId) {
      filtered = filtered.filter((log) => log.behaviorId === selectedBehaviorId);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((log) => {
        const behavior = behaviors.find((b) => b.id === log.behaviorId);
        return (
          behavior?.name.toLowerCase().includes(query) ||
          log.notes?.toLowerCase().includes(query)
        );
      });
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, startDate, endDate, selectedBehaviorId, searchQuery, behaviors]);

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    const statsByBehavior: Record<string, AggregateStats> = {};

    filteredLogs.forEach((log) => {
      if (!statsByBehavior[log.behaviorId]) {
        statsByBehavior[log.behaviorId] = {
          total: 0,
          count: 0,
          average: 0,
          min: Infinity,
          max: -Infinity,
        };
      }

      const stats = statsByBehavior[log.behaviorId];
      stats.total += log.quantity;
      stats.count += 1;
      stats.min = Math.min(stats.min, log.quantity);
      stats.max = Math.max(stats.max, log.quantity);
    });

    // Calculate averages
    Object.values(statsByBehavior).forEach((stats) => {
      stats.average = stats.count > 0 ? stats.total / stats.count : 0;
    });

    return statsByBehavior;
  }, [filteredLogs]);

  // Group logs by date
  const logsByDate = useMemo(() => {
    const grouped: Record<string, BehaviorLog[]> = {};
    filteredLogs.forEach((log) => {
      const date = new Date(log.timestamp);
      const dateKey = date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });
    return grouped;
  }, [filteredLogs]);

  const handleDeleteLog = (log: BehaviorLog) => {
    const behavior = behaviors.find((b) => b.id === log.behaviorId);
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

  const handleEditLog = (log: BehaviorLog) => {
    setEditingLog(log);
    setEditQuantity(log.quantity.toString());
    setEditWeight(log.weight?.toString() || '');
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    const quantity = parseFloat(editQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid quantity');
      return;
    }

    const weight = editWeight.trim() ? parseFloat(editWeight) : undefined;
    if (editWeight.trim() && (isNaN(weight!) || weight! <= 0)) {
      Alert.alert('Invalid Input', 'Please enter a valid weight');
      return;
    }

    await updateLog(editingLog.id, { quantity, weight });
    setEditingLog(null);
    setEditQuantity('');
    setEditWeight('');
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setEditQuantity('');
    setEditWeight('');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderDateRangeSelector = () => (
    <View style={styles.dateRangeSelector}>
      {(['today', 'week', 'month', 'all'] as DateRangeOption[]).map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.dateRangeButton,
            dateRange === range && { backgroundColor: colors.tint },
            { borderColor: colors.border },
          ]}
          onPress={() => setDateRange(range)}>
          <Text
            style={[
              styles.dateRangeButtonText,
              { color: dateRange === range ? colors.background : colors.text },
            ]}>
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBehaviorFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.behaviorFilter}>
      <TouchableOpacity
        style={[
          styles.behaviorFilterButton,
          !selectedBehaviorId && { backgroundColor: colors.tint },
          { borderColor: colors.border },
        ]}
        onPress={() => setSelectedBehaviorId(null)}>
        <Text
          style={[
            styles.behaviorFilterButtonText,
            { color: !selectedBehaviorId ? colors.background : colors.text },
          ]}>
          All Behaviors
        </Text>
      </TouchableOpacity>
      {behaviors.map((behavior) => (
        <TouchableOpacity
          key={behavior.id}
          style={[
            styles.behaviorFilterButton,
            selectedBehaviorId === behavior.id && { backgroundColor: colors.tint },
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedBehaviorId(behavior.id)}>
          <Text
            style={[
              styles.behaviorFilterButtonText,
              { color: selectedBehaviorId === behavior.id ? colors.background : colors.text },
            ]}>
            {behavior.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAggregateStats = () => {
    const displayBehaviors = selectedBehaviorId
      ? behaviors.filter((b) => b.id === selectedBehaviorId)
      : behaviors.filter((b) => aggregateStats[b.id]);

    if (displayBehaviors.length === 0) return null;

    return (
      <View style={styles.aggregateSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
        {displayBehaviors.map((behavior) => {
          const stats = aggregateStats[behavior.id];
          if (!stats) return null;

          return (
            <View
              key={behavior.id}
              style={[styles.aggregateCard, { backgroundColor: colors.tint + '10' }]}>
              <Text style={[styles.aggregateBehaviorName, { color: colors.text }]}>
                {behavior.name}
              </Text>
              <View style={styles.aggregateStats}>
                <View style={styles.aggregateStat}>
                  <Text style={[styles.aggregateStatValue, { color: colors.tint }]}>
                    {stats.total.toFixed(1)}
                  </Text>
                  <Text style={[styles.aggregateStatLabel, { color: colors.icon }]}>
                    Total {behavior.units}
                  </Text>
                </View>
                <View style={styles.aggregateStat}>
                  <Text style={[styles.aggregateStatValue, { color: colors.tint }]}>
                    {stats.average.toFixed(1)}
                  </Text>
                  <Text style={[styles.aggregateStatLabel, { color: colors.icon }]}>Average</Text>
                </View>
                <View style={styles.aggregateStat}>
                  <Text style={[styles.aggregateStatValue, { color: colors.tint }]}>
                    {stats.count}
                  </Text>
                  <Text style={[styles.aggregateStatLabel, { color: colors.icon }]}>Entries</Text>
                </View>
              </View>
              <View style={styles.aggregateRange}>
                <Text style={[styles.aggregateRangeText, { color: colors.icon }]}>
                  Range: {stats.min.toFixed(1)} - {stats.max.toFixed(1)} {behavior.units}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLogItem = (log: BehaviorLog) => {
    const behavior = behaviors.find((b) => b.id === log.behaviorId);
    if (!behavior) return null;

    const isEditing = editingLog?.id === log.id;

    if (isEditing) {
      return (
        <View
          key={log.id}
          style={[
            styles.logItem,
            styles.editingLogItem,
            { backgroundColor: colors.background, borderColor: colors.tint },
          ]}>
          <View style={styles.editForm}>
            <Text style={[styles.editLabel, { color: colors.text }]}>Quantity:</Text>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.icon}
            />
            {behavior.type === 'weight' && (
              <>
                <Text style={[styles.editLabel, { color: colors.text }]}>Weight:</Text>
                <TextInput
                  style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                  value={editWeight}
                  onChangeText={setEditWeight}
                  keyboardType="numeric"
                  placeholder="Optional"
                  placeholderTextColor={colors.icon}
                />
              </>
            )}
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancelEdit}>
                <Text style={[styles.editButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={handleSaveEdit}>
                <Text style={[styles.editButtonText, { color: colors.background }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View
        key={log.id}
        style={[
          styles.logItem,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}>
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <Text style={[styles.logBehaviorName, { color: colors.text }]}>{behavior.name}</Text>
            <Text style={[styles.logTime, { color: colors.icon }]}>{formatTime(log.timestamp)}</Text>
          </View>
          <View style={styles.logDetails}>
            <Text style={[styles.logQuantity, { color: colors.text }]}>
              {log.quantity} {behavior.units}
            </Text>
            {log.weight && (
              <Text style={[styles.logWeight, { color: colors.icon }]}>@ {log.weight} lbs</Text>
            )}
          </View>
          {log.notes && (
            <Text style={[styles.logNotes, { color: colors.icon }]}>{log.notes}</Text>
          )}
        </View>
        <View style={styles.logActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditLog(log)}
            testID={`edit-log-${log.id}`}>
            <IconSymbol name="pencil" size={18} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteLog(log)}
            testID={`delete-log-${log.id}`}>
            <IconSymbol name="trash" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHistoryList = () => {
    if (filteredLogs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol name="calendar" size={64} color={colors.icon} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Logs Found</Text>
          <Text style={[styles.emptyMessage, { color: colors.icon }]}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Start logging behaviors to see your history'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.historyList}>
        {Object.entries(logsByDate).map(([dateKey, dateLogs]) => (
          <View key={dateKey} style={styles.dateGroup}>
            <Text style={[styles.dateHeader, { color: colors.text }]}>{formatDate(dateKey)}</Text>
            {dateLogs.map(renderLogItem)}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Behavior History</Text>
          <TouchableOpacity onPress={onClose} testID="close-history">
            <IconSymbol name="xmark" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          <View style={[styles.searchContainer, { backgroundColor: colors.tint + '10' }]}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search behaviors or notes..."
              placeholderTextColor={colors.icon}
              testID="search-input"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={20} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>

          {renderDateRangeSelector()}
          {renderBehaviorFilter()}
        </View>

        <ScrollView style={styles.content}>
          {renderAggregateStats()}
          {renderHistoryList()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  filters: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  dateRangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  behaviorFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  behaviorFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  behaviorFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  aggregateSection: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  aggregateCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  aggregateBehaviorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  aggregateStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  aggregateStat: {
    alignItems: 'center',
    flex: 1,
  },
  aggregateStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  aggregateStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  aggregateRange: {
    alignItems: 'center',
  },
  aggregateRangeText: {
    fontSize: 14,
  },
  historyList: {
    padding: 20,
    gap: 24,
  },
  dateGroup: {
    gap: 12,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  logItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  editingLogItem: {
    borderWidth: 2,
  },
  logContent: {
    flex: 1,
    gap: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logBehaviorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 14,
  },
  logDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logQuantity: {
    fontSize: 16,
  },
  logWeight: {
    fontSize: 14,
  },
  logNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  logActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  editForm: {
    flex: 1,
    gap: 12,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
});
