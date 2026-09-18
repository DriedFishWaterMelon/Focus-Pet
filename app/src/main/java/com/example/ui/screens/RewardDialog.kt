package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Celebration
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Pet
import com.example.data.model.ScreenFreeSession
import com.example.ui.components.BadgeVariant
import com.example.ui.components.ButtonVariant
import com.example.ui.components.ShadcnBadge
import com.example.ui.components.ShadcnButton
import com.example.ui.components.ShadcnProgressBar
import com.example.ui.theme.Amber400
import com.example.ui.theme.Emerald400
import com.example.ui.theme.Rose400
import com.example.ui.theme.Violet400
import com.example.ui.theme.Zinc400
import com.example.ui.theme.Zinc50
import com.example.ui.theme.Zinc700
import com.example.ui.theme.Zinc800
import com.example.ui.theme.Zinc900

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RewardDialog(
    session: ScreenFreeSession,
    pet: Pet,
    onDismiss: () -> Unit
) {
    BasicAlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier
            .fillMaxWidth(0.92f)
            .clip(RoundedCornerShape(20.dp))
            .background(Zinc900)
            .border(1.dp, Zinc800, RoundedCornerShape(20.dp))
            .padding(20.dp)
            .testTag("reward_dialog")
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Icon header
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(Emerald400.copy(alpha = 0.15f))
                    .border(1.dp, Emerald400.copy(alpha = 0.4f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "🎉", fontSize = 28.sp)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Screen-Free Completed!",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Zinc50
            )

            Text(
                text = "You resisted phone distractions for ${session.actualMinutes} minutes!",
                fontSize = 13.sp,
                color = Zinc400,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(18.dp))

            // Reward Items Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // EXP Box
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Zinc800.copy(alpha = 0.6f))
                        .border(1.dp, Zinc700, RoundedCornerShape(12.dp))
                        .padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(text = "⭐", fontSize = 20.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "+${session.expEarned} EXP",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Violet400
                    )
                    Text(text = "Pet Growth", fontSize = 11.sp, color = Zinc400)
                }

                // Coins Box
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Zinc800.copy(alpha = 0.6f))
                        .border(1.dp, Zinc700, RoundedCornerShape(12.dp))
                        .padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(text = "🪙", fontSize = 20.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "+${session.coinsEarned} Coins",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Amber400
                    )
                    Text(text = "Pantry Wealth", fontSize = 11.sp, color = Zinc400)
                }
            }

            if (session.itemRewardName != null) {
                Spacer(modifier = Modifier.height(10.dp))
                // Item Drop Card
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Emerald400.copy(alpha = 0.12f))
                        .border(1.dp, Emerald400.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "🎁", fontSize = 22.sp)
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "New Item Unlocked!",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Emerald400
                        )
                        Text(
                            text = session.itemRewardName,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = Zinc50
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Pet Progress bar
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Zinc800)
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "${pet.name} (Level ${pet.level})",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Zinc50
                    )
                    Text(
                        text = "${pet.stage.displayName}",
                        fontSize = 11.sp,
                        color = Emerald400
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                ShadcnProgressBar(
                    value = pet.expProgress,
                    barColor = Violet400,
                    height = 6.dp
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            ShadcnButton(
                text = "Claim & Keep Growing",
                icon = Icons.Default.Check,
                onClick = onDismiss,
                variant = ButtonVariant.EMERALD,
                modifier = Modifier.fillMaxWidth(),
                testTag = "claim_reward_button"
            )
        }
    }
}
