import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notifAPI } from '../../services/api';
import { colors, spacing, radius, typography, shadow } from '../../theme';

const TYPE_CONFIG = {
  cry:         { icon:'volume-high-outline',    color:colors.accent   },
  motion:      { icon:'walk-outline',           color:colors.amber    },
  temperature: { icon:'thermometer-outline',    color:colors.danger   },
  humidity:    { icon:'water-outline',          color:colors.info     },
  sleep:       { icon:'moon-outline',           color:colors.primary  },
  summary:     { icon:'bar-chart-outline',      color:colors.green    },
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const load = async () => {
    try {
      const list = await notifAPI.list();
      setNotifications(Array.isArray(list) ? list : list.results || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id) => {
    await notifAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id===id ? {...n,read:true} : n));
  };

  const unread = notifications.filter((n) => !n.read).length;

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 && <Text style={styles.unreadText}>{unread} unread</Text>}
        </View>
        <View style={{ width:24 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load();}} />}>
        {notifications.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyBody}>Alerts will appear here when your baby needs attention.</Text>
          </View>
        )}
        {notifications.map((n) => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.summary;
          return (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifCard, !n.read && styles.notifCardUnread]}
              onPress={() => handleMarkRead(n.id)}
            >
              <View style={[styles.notifIcon,{backgroundColor:cfg.color+'20'}]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={styles.notifBody}>
                <View style={styles.notifTop}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  {!n.read && <View style={[styles.unreadDot,{backgroundColor:cfg.color}]} />}
                </View>
                <Text style={styles.notifText}>{n.body}</Text>
                <View style={styles.notifMeta}>
                  {n.baby && <Text style={styles.notifBaby}>{n.baby}</Text>}
                  <Text style={styles.notifTime}>
                    {new Date(n.created_at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height:40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:colors.bg },
  loading:         { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:colors.bg },
  header:          { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingTop:60, paddingHorizontal:spacing.lg, paddingBottom:spacing.md, backgroundColor:colors.bgCard, borderBottomWidth:1, borderBottomColor:colors.border },
  title:           { ...typography.h3, color:colors.textPrimary },
  unreadText:      { ...typography.tiny, color:colors.primary },
  empty:           { alignItems:'center', padding:spacing.xxl*2 },
  emptyTitle:      { ...typography.h3, color:colors.textPrimary, marginTop:spacing.lg },
  emptyBody:       { ...typography.body, color:colors.textSecondary, textAlign:'center', marginTop:8 },
  notifCard:       { flexDirection:'row', backgroundColor:colors.bgCard, marginHorizontal:spacing.lg, marginTop:spacing.sm, borderRadius:radius.lg, padding:spacing.md, ...shadow.sm },
  notifCardUnread: { borderLeftWidth:3, borderLeftColor:colors.primary },
  notifIcon:       { width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center', marginRight:12 },
  notifBody:       { flex:1 },
  notifTop:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  notifTitle:      { ...typography.small, fontWeight:'700', color:colors.textPrimary, flex:1 },
  unreadDot:       { width:8, height:8, borderRadius:4 },
  notifText:       { ...typography.small, color:colors.textSecondary, marginTop:4 },
  notifMeta:       { flexDirection:'row', justifyContent:'space-between', marginTop:6 },
  notifBaby:       { ...typography.tiny, color:colors.primary, fontWeight:'600' },
  notifTime:       { ...typography.tiny, color:colors.textMuted },
});
