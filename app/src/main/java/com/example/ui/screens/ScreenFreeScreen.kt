package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Pet
import com.example.ui.components.BadgeVariant
import com.example.ui.components.ButtonVariant
import com.example.ui.components.PetVisualCanvas
import com.example.ui.components.ShadcnBadge
import com.example.ui.components.ShadcnButton
import com.example.ui.components.ShadcnCard
import com.example.ui.components.ShadcnProgressBar
import com.example.ui.theme.Emerald400
import com.example.ui.theme.Emerald500
import com.example.ui.theme.Red500
import com.example.ui.theme.Violet400
import com.example.ui.theme.Zinc100
import com.example.ui.theme.Zinc400
import com.example.ui.theme.Zinc50
import com.example.ui.theme.Zinc700
import com.example.ui.theme.Zinc800
import com.example.ui.theme.Zinc900

@Composable
fun ScreenFreeScreen(
    pet: Pet,
    isFocusActive: Boolean,
    targetDurationMinutes: Int,
    remainingSeconds: Int,
    selectedTag: String,
    onSelectDuration: (Int) -> Unit,
    onSelectTag: (String) -> Unit,
    onStartFocus: () -> Unit,
    onCancelFocus: () -> Unit,
    onFinishEarly: () -> Unit,
    modifier: Modifier = Modifier
) {
    val durationPresets = listOf(15, 25, 30, 45, 60, 90)
    val tags = listOf("Deep Work", "Study & Reading", "Digital Detox", "Sleep Rest", "Exercise")

    val totalSeconds = targetDurationMinutes * 60
    val progressRatio = if (totalSeconds > 0) {
        (totalSeconds - remainingSeconds).toFloat() / totalSeconds.toFloat()
    } else 0f

    val minutesPart = remainingSeconds / 60
    val secondsPart = remainingSeconds % 60
    val timeFormatted = String.format("%02d:%02d", minutesPart, secondsPart)

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        // Title Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Screen-Free Focus",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Zinc50,
                    letterSpacing = (-0.5).sp
                )
                Text(
                    text = if (isFocusActive) "Session in progress" else "Convert screen-free time into pet growth",
                    fontSize = 13.sp,
                    color = Zinc400
                )
            }

            if (isFocusActive) {
                ShadcnBadge(
                    text = "ACTIVE",
                    variant = BadgeVariant.SUCCESS
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Central Meditating Pet Display
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(220.dp)
        ) {
            PetVisualCanvas(
                pet = pet,
                isFocusing = isFocusActive,
                isEating = false,
                canvasSize = 210.dp
            )
        }

        // Digital Countdown & Progress Section
        if (isFocusActive) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = timeFormatted,
                    fontSize = 54.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = Zinc50,
                    letterSpacing = 2.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                ShadcnBadge(
                    text = "🏷️ $selectedTag",
                    variant = BadgeVariant.SECONDARY
                )

                Spacer(modifier = Modifier.height(16.dp))

                ShadcnProgressBar(
                    value = progressRatio,
                    barColor = Emerald400,
                    height = 10.dp,
                    modifier = Modifier.padding(horizontal = 24.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "${((progressRatio) * 100).toInt()}% completed",
                    fontSize = 12.sp,
                    color = Zinc400
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Facedown / Screen Off Advice Box
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Zinc900)
                        .border(1.dp, Zinc800, RoundedCornerShape(12.dp))
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "📵", fontSize = 24.sp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Lock your screen or put phone facedown",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Zinc50
                        )
                        Text(
                            text = "${pet.name} is resting quietly. No distraction until the bell rings!",
                            fontSize = 12.sp,
                            color = Zinc400
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Action Buttons (Finish / Cancel)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    ShadcnButton(
                        text = "Give Up",
                        icon = Icons.Default.Cancel,
                        onClick = onCancelFocus,
                        variant = ButtonVariant.DESTRUCTIVE,
                        modifier = Modifier.weight(1f),
                        testTag = "cancel_focus_button"
                    )
                    ShadcnButton(
                        text = "Finish Session",
                        icon = Icons.Default.CheckCircle,
                        onClick = onFinishEarly,
                        variant = ButtonVariant.EMERALD,
                        modifier = Modifier.weight(1f),
                        testTag = "finish_focus_button"
                    )
                }
            }
        } else {
            // Setup Mode: Select Duration & Tags
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Select Duration",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Zinc50
                )
                Spacer(modifier = Modifier.height(10.dp))

                // Presets Grid
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    durationPresets.take(3).forEach { minutes ->
                        val isSelected = targetDurationMinutes == minutes
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) Zinc50 else Zinc900)
                                .border(
                                    1.dp,
                                    if (isSelected) Zinc50 else Zinc800,
                                    RoundedCornerShape(12.dp)
                                )
                                .clickable { onSelectDuration(minutes) }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "$minutes min",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isSelected) Zinc900 else Zinc50
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    durationPresets.drop(3).forEach { minutes ->
                        val isSelected = targetDurationMinutes == minutes
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) Zinc50 else Zinc900)
                                .border(
                                    1.dp,
                                    if (isSelected) Zinc50 else Zinc800,
                                    RoundedCornerShape(12.dp)
                                )
                                .clickable { onSelectDuration(minutes) }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "$minutes min",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isSelected) Zinc900 else Zinc50
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Focus Activity Tag Picker
                Text(
                    text = "Activity Tag",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Zinc50
                )
                Spacer(modifier = Modifier.height(10.dp))

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(tags) { tag ->
                        val isSelected = selectedTag == tag
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(if (isSelected) Emerald400.copy(alpha = 0.2f) else Zinc900)
                                .border(
                                    1.dp,
                                    if (isSelected) Emerald400 else Zinc800,
                                    CircleShape
                                )
                                .clickable { onSelectTag(tag) }
                                .padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = tag,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = if (isSelected) Emerald400 else Zinc400
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Estimated Rewards Card
                ShadcnCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Estimated Rewards",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Zinc50
                        )
                        ShadcnBadge(text = "+${targetDurationMinutes * 2 + 20} EXP", variant = BadgeVariant.VIOLET)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "• Gained coins: ~${targetDurationMinutes + 10} coins\n• Chance to find rare fruit: ${if (targetDurationMinutes >= 45) "Golden Honey Apple" else "Crisp Forest Berry"}\n• Pet energy & happiness restored upon completion",
                        fontSize = 12.sp,
                        color = Zinc400,
                        lineHeight = 18.sp
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                ShadcnButton(
                    text = "Start Screen-Free Time ($targetDurationMinutes min)",
                    icon = Icons.Default.PlayArrow,
                    onClick = onStartFocus,
                    variant = ButtonVariant.EMERALD,
                    modifier = Modifier.fillMaxWidth(),
                    testTag = "start_focus_timer_button"
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}
