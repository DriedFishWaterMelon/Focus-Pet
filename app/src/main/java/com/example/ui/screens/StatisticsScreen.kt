package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Smartphone
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Pet
import com.example.data.model.ScreenFreeSession
import com.example.service.AppUsageInfo
import com.example.ui.components.BadgeVariant
import com.example.ui.components.ButtonVariant
import com.example.ui.components.ShadcnBadge
import com.example.ui.components.ShadcnButton
import com.example.ui.components.ShadcnCard
import com.example.ui.components.ShadcnProgressBar
import com.example.ui.theme.Amber400
import com.example.ui.theme.Emerald400
import com.example.ui.theme.Red500
import com.example.ui.theme.Rose400
import com.example.ui.theme.Sky400
import com.example.ui.theme.Violet400
import com.example.ui.theme.Zinc400
import com.example.ui.theme.Zinc50
import com.example.ui.theme.Zinc700
import com.example.ui.theme.Zinc800
import com.example.ui.theme.Zinc900
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun StatisticsScreen(
    pet: Pet,
    sessions: List<ScreenFreeSession>,
    hasUsagePermission: Boolean,
    todayScreenTimeMinutes: Int,
    topApps: List<AppUsageInfo>,
    onRequestUsagePermission: () -> Unit,
    onRefreshStats: () -> Unit,
    modifier: Modifier = Modifier
) {
    val totalScreenFreeMinutes = sessions.filter { it.completed }.sumOf { it.actualMinutes }
    val todayCompletedMinutes = sessions.filter {
        val sessionCal = java.util.Calendar.getInstance().apply { timeInMillis = it.endTime }
        val todayCal = java.util.Calendar.getInstance()
        sessionCal.get(java.util.Calendar.DAY_OF_YEAR) == todayCal.get(java.util.Calendar.DAY_OF_YEAR)
    }.sumOf { it.actualMinutes }

    val screenTimeHours = todayScreenTimeMinutes / 60
    val screenTimeMins = todayScreenTimeMinutes % 60

    val screenFreeHours = todayCompletedMinutes / 60
    val screenFreeMins = todayCompletedMinutes % 60

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Digital Wellness Stats",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Zinc50,
                        letterSpacing = (-0.5).sp
                    )
                    Text(
                        text = "Screen Time vs Screen-Free Balance",
                        fontSize = 13.sp,
                        color = Zinc400
                    )
                }

                ShadcnButton(
                    text = "Refresh",
                    icon = Icons.Default.Refresh,
                    onClick = onRefreshStats,
                    variant = ButtonVariant.GHOST,
                    testTag = "refresh_stats_button"
                )
            }
        }

        // UsageStats Permission Banner if not granted
        if (!hasUsagePermission) {
            item {
                ShadcnCard(
                    modifier = Modifier.fillMaxWidth(),
                    backgroundColor = Zinc900,
                    borderColor = Amber400.copy(alpha = 0.5f)
                ) {
                    Row(verticalAlignment = Alignment.Top) {
                        Text(text = "🛡️", fontSize = 22.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Usage Access Permission Needed",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Zinc50
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Grant Android Usage Access to accurately track real screen time and calculate detox rewards.",
                                fontSize = 12.sp,
                                color = Zinc400
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            ShadcnButton(
                                text = "Enable Usage Access",
                                onClick = onRequestUsagePermission,
                                variant = ButtonVariant.EMERALD,
                                testTag = "grant_usage_permission_button"
                            )
                        }
                    }
                }
            }
        }

        // Today's Balance Comparison Card
        item {
            ShadcnCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Today's Balance",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Zinc50
                )
                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Screen-Free Box
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Emerald400.copy(alpha = 0.1f))
                            .border(1.dp, Emerald400.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(14.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "🌿", fontSize = 16.sp)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "Screen-Free", fontSize = 12.sp, color = Emerald400, fontWeight = FontWeight.SemiBold)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "${screenFreeHours}h ${screenFreeMins}m",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Zinc50
                        )
                        Text(text = "Pet Recharged", fontSize = 11.sp, color = Zinc400)
                    }

                    // Screen Time Box
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Rose400.copy(alpha = 0.1f))
                            .border(1.dp, Rose400.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(14.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "📱", fontSize = 16.sp)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "Screen Time", fontSize = 12.sp, color = Rose400, fontWeight = FontWeight.SemiBold)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "${screenTimeHours}h ${screenTimeMins}m",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Zinc50
                        )
                        Text(
                            text = if (hasUsagePermission) "From Android API" else "Baseline Est.",
                            fontSize = 11.sp,
                            color = Zinc400
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Ratio Bar
                val totalCombined = (todayCompletedMinutes + todayScreenTimeMinutes).coerceAtLeast(1)
                val screenFreeRatio = todayCompletedMinutes.toFloat() / totalCombined.toFloat()

                Text(
                    text = "Screen-Free Ratio: ${(screenFreeRatio * 100).toInt()}%",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = Zinc50
                )
                Spacer(modifier = Modifier.height(6.dp))
                ShadcnProgressBar(
                    value = screenFreeRatio,
                    barColor = Emerald400,
                    backgroundColor = Rose400.copy(alpha = 0.3f),
                    height = 8.dp
                )
            }
        }

        // Top Apps Screen-Time Breakdown
        if (topApps.isNotEmpty()) {
            item {
                ShadcnCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Top Screen-Time Usages",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Zinc50
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    topApps.forEach { app ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(text = app.iconEmoji, fontSize = 18.sp)
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = app.appName,
                                    fontSize = 13.sp,
                                    color = Zinc50,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            Text(
                                text = "${app.usageTimeMinutes} mins",
                                fontSize = 13.sp,
                                color = Zinc400
                            )
                        }
                    }
                }
            }
        }

        // Daily History of Screen-Free Sessions
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Session History (${sessions.size})",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Zinc50
                )
                Text(
                    text = "Total ${totalScreenFreeMinutes}m focused",
                    fontSize = 12.sp,
                    color = Emerald400
                )
            }
        }

        if (sessions.isEmpty()) {
            item {
                ShadcnCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "No focus sessions recorded yet.\nStart your first screen-free session to build history!",
                        fontSize = 13.sp,
                        color = Zinc400,
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                }
            }
        } else {
            items(sessions) { session ->
                val dateFormat = SimpleDateFormat("MMM d, HH:mm", Locale.getDefault())
                val dateString = dateFormat.format(Date(session.endTime))

                ShadcnCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(if (session.completed) Emerald400.copy(alpha = 0.15f) else Amber400.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = if (session.completed) "🎯" else "⏱️", fontSize = 16.sp)
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = session.tag,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Zinc50
                                )
                                Text(
                                    text = dateString,
                                    fontSize = 11.sp,
                                    color = Zinc400
                                )
                            }
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "${session.actualMinutes} min",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (session.completed) Emerald400 else Amber400
                            )
                            Text(
                                text = "+${session.expEarned} EXP",
                                fontSize = 11.sp,
                                color = Violet400
                            )
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
