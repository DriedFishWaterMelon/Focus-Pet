package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.InventoryItem
import com.example.data.model.Pet
import com.example.ui.components.BadgeVariant
import com.example.ui.components.ButtonVariant
import com.example.ui.components.PetVisualCanvas
import com.example.ui.components.ShadcnBadge
import com.example.ui.components.ShadcnButton
import com.example.ui.components.ShadcnCard
import com.example.ui.components.ShadcnStatBar
import com.example.ui.theme.Amber400
import com.example.ui.theme.Emerald400
import com.example.ui.theme.Rose400
import com.example.ui.theme.Violet400
import com.example.ui.theme.Zinc400
import com.example.ui.theme.Zinc50
import com.example.ui.theme.Zinc700
import com.example.ui.theme.Zinc800
import com.example.ui.theme.Zinc900

@Composable
fun HomeScreen(
    pet: Pet,
    inventory: List<InventoryItem>,
    isEating: Boolean,
    onPetTap: () -> Unit,
    onFeedItem: (InventoryItem) -> Unit,
    onNavigateToScreenFree: () -> Unit,
    modifier: Modifier = Modifier
) {
    var heartParticleVisible by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            // Header with Pet Identity & Level
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = pet.name,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Zinc50,
                            letterSpacing = (-0.5).sp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        ShadcnBadge(
                            text = "Lv.${pet.level}",
                            variant = BadgeVariant.VIOLET
                        )
                    }
                    Text(
                        text = "${pet.stage.displayName} • ${pet.species}",
                        fontSize = 13.sp,
                        color = Zinc400
                    )
                }

                // Streak Badge
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Zinc900)
                        .border(1.dp, Zinc800, RoundedCornerShape(12.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "🔥", fontSize = 16.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Column {
                        Text(
                            text = "${pet.streakDays} Days",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Amber400
                        )
                        Text(
                            text = "Focus Streak",
                            fontSize = 9.sp,
                            color = Zinc400
                        )
                    }
                }
            }
        }

        // Virtual Pet Stage
        item {
            ShadcnCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("pet_canvas_card")
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Mood & Stage Pills
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        ShadcnBadge(
                            text = "${pet.mood.emoji} ${pet.mood.label}",
                            variant = BadgeVariant.SECONDARY
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "🪙", fontSize = 13.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${pet.coins}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Amber400
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Animated Pet
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.size(210.dp)
                    ) {
                        PetVisualCanvas(
                            pet = pet,
                            isFocusing = false,
                            isEating = isEating,
                            onPetTap = {
                                heartParticleVisible = true
                                onPetTap()
                            },
                            canvasSize = 200.dp
                        )

                        // Joyful Heart Float Particle
                        androidx.compose.animation.AnimatedVisibility(
                            visible = heartParticleVisible,
                            enter = fadeIn(),
                            exit = fadeOut(),
                            modifier = Modifier.align(Alignment.TopCenter)
                        ) {
                            Text(text = "💖 +Happiness!", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Rose400)
                        }
                    }

                    Text(
                        text = "Tap ${pet.name} to pet & bond",
                        fontSize = 12.sp,
                        color = Zinc400,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )

                    // Quick Action Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ShadcnButton(
                            text = "Pet Companion",
                            icon = Icons.Default.Favorite,
                            onClick = {
                                heartParticleVisible = true
                                onPetTap()
                            },
                            variant = ButtonVariant.SECONDARY,
                            modifier = Modifier.weight(1f),
                            testTag = "pet_companion_button"
                        )
                        ShadcnButton(
                            text = "Start Focus",
                            icon = Icons.Default.PlayArrow,
                            onClick = onNavigateToScreenFree,
                            variant = ButtonVariant.EMERALD,
                            modifier = Modifier.weight(1f),
                            testTag = "home_start_focus_button"
                        )
                    }
                }
            }
        }

        // Pet Status Overview (Hunger, Happiness, Energy, EXP)
        item {
            ShadcnCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("pet_status_card")
            ) {
                Text(
                    text = "Vitals & Growth",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Zinc50
                )
                Text(
                    text = "Screen-free time restores energy & grants growth EXP",
                    fontSize = 12.sp,
                    color = Zinc400
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Hunger
                ShadcnStatBar(
                    label = "Hunger",
                    current = pet.hunger,
                    max = 100f,
                    icon = "🍽️",
                    accentColor = Emerald400
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Happiness
                ShadcnStatBar(
                    label = "Happiness",
                    current = pet.happiness,
                    max = 100f,
                    icon = "💖",
                    accentColor = Rose400
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Energy
                ShadcnStatBar(
                    label = "Energy",
                    current = pet.energy,
                    max = 100f,
                    icon = "⚡",
                    accentColor = Amber400
                )

                Spacer(modifier = Modifier.height(12.dp))

                // EXP / Level
                ShadcnStatBar(
                    label = "EXP (Stage Progress)",
                    current = (pet.exp % 100).toFloat(),
                    max = 100f,
                    icon = "⭐",
                    accentColor = Violet400
                )
            }
        }

        // Quick Treat Feeding Tray
        item {
            ShadcnCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("quick_feed_card")
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Quick Treats",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Zinc50
                    )
                    Text(
                        text = "Tap to feed",
                        fontSize = 12.sp,
                        color = Zinc400
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                val foods = inventory.filter { it.quantity > 0 }
                if (foods.isEmpty()) {
                    Text(
                        text = "No treats left in pantry! Complete a screen-free session to discover more treats.",
                        fontSize = 13.sp,
                        color = Zinc400,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                } else {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(foods) { item ->
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Zinc800.copy(alpha = 0.6f))
                                    .border(1.dp, Zinc700, RoundedCornerShape(12.dp))
                                    .clickable { onFeedItem(item) }
                                    .padding(horizontal = 14.dp, vertical = 10.dp)
                            ) {
                                Text(text = item.iconEmoji, fontSize = 24.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = item.name.split(" ").first(),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Zinc50
                                )
                                Text(
                                    text = "x${item.quantity}",
                                    fontSize = 11.sp,
                                    color = Amber400
                                )
                            }
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
