package com.example.ui.screens

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Fastfood
import androidx.compose.material.icons.filled.Pets
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import com.example.data.model.ItemCategory
import com.example.data.model.Pet
import com.example.data.model.PetStage
import com.example.ui.components.BadgeVariant
import com.example.ui.components.ButtonVariant
import com.example.ui.components.PetVisualCanvas
import com.example.ui.components.ShadcnBadge
import com.example.ui.components.ShadcnButton
import com.example.ui.components.ShadcnCard
import com.example.ui.theme.Amber400
import com.example.ui.theme.Emerald400
import com.example.ui.theme.Rose400
import com.example.ui.theme.Violet400
import com.example.ui.theme.Zinc100
import com.example.ui.theme.Zinc400
import com.example.ui.theme.Zinc50
import com.example.ui.theme.Zinc700
import com.example.ui.theme.Zinc800
import com.example.ui.theme.Zinc900

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryScreen(
    pet: Pet,
    inventory: List<InventoryItem>,
    onFeedItem: (InventoryItem) -> Unit,
    onRenamePet: (String) -> Unit,
    onChangeSpecies: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var showRenameDialog by remember { mutableStateOf(false) }
    var petNameInput by remember { mutableStateOf(pet.name) }
    var selectedCategoryFilter by remember { mutableStateOf<ItemCategory?>(null) }

    val filteredItems = if (selectedCategoryFilter != null) {
        inventory.filter { it.category == selectedCategoryFilter }
    } else {
        inventory
    }

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
                        text = "Pet & Inventory",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Zinc50,
                        letterSpacing = (-0.5).sp
                    )
                    Text(
                        text = "Pantry items, treats, and companion customization",
                        fontSize = 13.sp,
                        color = Zinc400
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "🪙", fontSize = 16.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${pet.coins}",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Amber400
                    )
                }
            }
        }

        // Companion Customization Card
        item {
            ShadcnCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = pet.name,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Zinc50
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        ShadcnBadge(text = pet.species, variant = BadgeVariant.SECONDARY)
                    }

                    ShadcnButton(
                        text = "Rename",
                        icon = Icons.Default.Edit,
                        onClick = {
                            petNameInput = pet.name
                            showRenameDialog = true
                        },
                        variant = ButtonVariant.OUTLINE,
                        testTag = "rename_pet_button"
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Species selector
                Text(
                    text = "Companion Species Variant",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = Zinc400
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val speciesOptions = listOf("Leafy Dragon", "Cyber Fox", "Astro Bunny")
                    speciesOptions.forEach { spec ->
                        val isSelected = pet.species == spec
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSelected) Emerald400.copy(alpha = 0.18f) else Zinc800)
                                .border(1.dp, if (isSelected) Emerald400 else Zinc700, RoundedCornerShape(10.dp))
                                .clickable { onChangeSpecies(spec) }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = spec,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isSelected) Emerald400 else Zinc400
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Evolution Stages Overview
                Text(
                    text = "Evolution Growth Stages",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = Zinc400
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    PetStage.entries.forEach { stage ->
                        val isReached = pet.level >= stage.minLevel
                        val isCurrent = pet.stage == stage
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (isCurrent) Emerald400
                                        else if (isReached) Zinc700
                                        else Zinc800
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (isReached) "✓" else "🔒",
                                    fontSize = 11.sp,
                                    color = if (isCurrent) Zinc900 else Zinc400
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Lv.${stage.minLevel}",
                                fontSize = 10.sp,
                                color = if (isReached) Zinc50 else Zinc400
                            )
                        }
                    }
                }
            }
        }

        // Inventory Category Filter Pills
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val filters = listOf(
                    null to "All Items",
                    ItemCategory.FOOD to "🍲 Food",
                    ItemCategory.POTION to "🧪 Potions",
                    ItemCategory.TOY to "🧸 Toys",
                    ItemCategory.BADGE to "⭐ Badges"
                )

                filters.forEach { (cat, label) ->
                    val isSelected = selectedCategoryFilter == cat
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (isSelected) Zinc50 else Zinc900)
                            .border(1.dp, if (isSelected) Zinc50 else Zinc800, CircleShape)
                            .clickable { selectedCategoryFilter = cat }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = label,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isSelected) Zinc900 else Zinc400
                        )
                    }
                }
            }
        }

        // Inventory Items List
        items(filteredItems) { item ->
            ShadcnCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("inventory_item_${item.id}")
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Zinc800),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(text = item.iconEmoji, fontSize = 24.sp)
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = item.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Zinc50
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "x${item.quantity}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Amber400
                                )
                            }
                            Text(
                                text = item.description,
                                fontSize = 11.sp,
                                color = Zinc400
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if (item.hungerBoost > 0) {
                                    ShadcnBadge(text = "+${item.hungerBoost.toInt()} Hunger", variant = BadgeVariant.SUCCESS)
                                }
                                if (item.happinessBoost > 0) {
                                    ShadcnBadge(text = "+${item.happinessBoost.toInt()} Joy", variant = BadgeVariant.SECONDARY)
                                }
                                if (item.energyBoost > 0) {
                                    ShadcnBadge(text = "+${item.energyBoost.toInt()} Energy", variant = BadgeVariant.WARNING)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    ShadcnButton(
                        text = if (item.category == ItemCategory.BADGE) "Badge" else "Use",
                        enabled = item.quantity > 0 && item.category != ItemCategory.BADGE,
                        onClick = { onFeedItem(item) },
                        variant = ButtonVariant.EMERALD,
                        testTag = "feed_item_${item.id}_button"
                    )
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
        }
    }

    // Rename Dialog
    if (showRenameDialog) {
        BasicAlertDialog(
            onDismissRequest = { showRenameDialog = false },
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .clip(RoundedCornerShape(16.dp))
                .background(Zinc900)
                .border(1.dp, Zinc800, RoundedCornerShape(16.dp))
                .padding(20.dp)
        ) {
            Column {
                Text(
                    text = "Name Your Pet",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Zinc50
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Give your digital wellness companion a friendly name.",
                    fontSize = 12.sp,
                    color = Zinc400
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = petNameInput,
                    onValueChange = { petNameInput = it },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Zinc50,
                        unfocusedTextColor = Zinc50,
                        focusedBorderColor = Emerald400,
                        unfocusedBorderColor = Zinc700,
                        focusedContainerColor = Zinc800,
                        unfocusedContainerColor = Zinc800
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ShadcnButton(
                        text = "Cancel",
                        onClick = { showRenameDialog = false },
                        variant = ButtonVariant.GHOST,
                        modifier = Modifier.weight(1f)
                    )
                    ShadcnButton(
                        text = "Save",
                        onClick = {
                            if (petNameInput.isNotBlank()) {
                                onRenamePet(petNameInput)
                            }
                            showRenameDialog = false
                        },
                        variant = ButtonVariant.EMERALD,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}
